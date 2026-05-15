import {
  CHUNK_SIZE_BYTES,
  MAX_CONCURRENT_TRANSFERS,
  MAX_RETRIES_PER_CHUNK,
  type UploadFileMetadata,
  type UploadTaskSnapshot
} from "@media-upload/shared-types";
import { createChunkDescriptors, getTotalChunks } from "./chunking";
import { ApiClient } from "./ApiClient";
import { canRetry, getRetryDelayMs } from "./retry";

type UploadApi = Pick<ApiClient, "initiate" | "uploadChunk" | "finalize" | "cancel">;

export type UploadSource = UploadFileMetadata & {
  slice?: (start: number, end: number) => Blob;
};

export type UploadManagerOptions = {
  chunkSize?: number;
  maxConcurrentTransfers?: number;
  maxRetriesPerChunk?: number;
  apiClient?: UploadApi;
  retryDelayMs?: (attempt: number) => number;
};

type TaskRuntime = {
  source: UploadSource;
  abortController?: AbortController;
  started: boolean;
};

type UploadTaskListener = (tasks: UploadTaskSnapshot[]) => void;

export class UploadManager {
  private readonly chunkSize: number;
  private readonly maxConcurrentTransfers: number;
  private readonly maxRetriesPerChunk: number;
  private readonly apiClient: UploadApi;
  private readonly retryDelayMs: (attempt: number) => number;
  private readonly tasks = new Map<string, UploadTaskSnapshot>();
  private readonly runtimes = new Map<string, TaskRuntime>();
  private readonly listeners = new Set<UploadTaskListener>();

  constructor(options: UploadManagerOptions = {}) {
    this.chunkSize = options.chunkSize ?? CHUNK_SIZE_BYTES;
    this.maxConcurrentTransfers = options.maxConcurrentTransfers ?? MAX_CONCURRENT_TRANSFERS;
    this.maxRetriesPerChunk = options.maxRetriesPerChunk ?? MAX_RETRIES_PER_CHUNK;
    this.apiClient = options.apiClient ?? new ApiClient();
    this.retryDelayMs = options.retryDelayMs ?? getRetryDelayMs;
  }

  addFile(file: UploadSource): UploadTaskSnapshot {
    const now = new Date().toISOString();
    const localId = crypto.randomUUID();
    const task: UploadTaskSnapshot = {
      localId,
      file,
      status: "queued",
      chunkSize: this.chunkSize,
      totalChunks: getTotalChunks(file.size, this.chunkSize),
      uploadedChunkIndexes: [],
      failedChunks: {},
      progress: {
        uploadedBytes: 0,
        totalBytes: file.size,
        percentage: 0
      },
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(localId, task);
    this.runtimes.set(localId, {
      source: file,
      started: false
    });
    this.notify();
    return task;
  }

  async start(localId: string): Promise<void> {
    const runtime = this.runtimes.get(localId);
    const task = this.tasks.get(localId);

    if (!runtime || !task || task.status === "completed" || task.status === "cancelled") {
      return;
    }

    if (!runtime.source.slice) {
      this.failTask(localId, {
        code: "invalid_type",
        message: "Selected file cannot be sliced into upload chunks.",
        retryable: false
      });
      return;
    }

    const abortController = new AbortController();
    runtime.abortController = abortController;
    runtime.started = true;

    try {
      let current = this.patchTask(localId, { status: task.uploadId ? "uploading" : "initializing" });

      if (!current.uploadId) {
        const initiated = await this.apiClient.initiate(
          {
            fileName: current.file.name,
            fileSize: current.file.size,
            mimeType: current.file.type,
            checksum: current.file.checksum,
            totalChunks: current.totalChunks,
            chunkSize: this.chunkSize
          },
          abortController.signal
        );

        if (initiated.status === "completed" && initiated.file) {
          this.patchTask(localId, {
            uploadId: initiated.uploadId ?? undefined,
            status: "completed",
            uploadedChunkIndexes: Array.from({ length: current.totalChunks }, (_, index) => index),
            progress: {
              uploadedBytes: current.file.size,
              totalBytes: current.file.size,
              percentage: 100
            },
            file: completeFileMetadata(current.file, initiated.file.url, initiated.file.checksum)
          });
          return;
        }

        current = this.patchTask(localId, {
          uploadId: initiated.uploadId ?? undefined,
          status: "uploading",
          uploadedChunkIndexes: initiated.uploadedChunkIndexes,
          progress: progressFromUploadedChunks(current.file.size, this.chunkSize, initiated.uploadedChunkIndexes)
        });
      }

      await this.uploadMissingChunks(localId, runtime, abortController.signal);

      current = this.tasks.get(localId) ?? current;
      if (current.status === "paused" || current.status === "cancelled") {
        return;
      }

      this.patchTask(localId, { status: "finalizing" });
      const uploadedFile = await this.apiClient.finalize(current.uploadId ?? "", abortController.signal);
      this.patchTask(localId, {
        status: "completed",
        error: undefined,
        file: completeFileMetadata(current.file, uploadedFile.url, uploadedFile.checksum),
        progress: {
          uploadedBytes: current.file.size,
          totalBytes: current.file.size,
          percentage: 100
        }
      });
    } catch (error) {
      if (isAbortError(error)) {
        if (this.tasks.get(localId)?.status !== "cancelled") {
          this.patchTask(localId, { status: "paused" });
        }
        return;
      }

      this.failTask(localId, {
        code: getErrorCode(error),
        message: getErrorMessage(error),
        retryable: getErrorRetryable(error)
      });
    }
  }

  listTasks(): UploadTaskSnapshot[] {
    return Array.from(this.tasks.values());
  }

  getTask(localId: string): UploadTaskSnapshot | undefined {
    return this.tasks.get(localId);
  }

  subscribe(listener: UploadTaskListener): () => void {
    this.listeners.add(listener);
    listener(this.listTasks());

    return () => {
      this.listeners.delete(listener);
    };
  }

  pause(localId: string): void {
    this.runtimes.get(localId)?.abortController?.abort();
    this.patchStatus(localId, "paused");
  }

  resume(localId: string): void {
    this.patchStatus(localId, "queued");
    void this.start(localId);
  }

  async cancel(localId: string): Promise<void> {
    const runtime = this.runtimes.get(localId);
    runtime?.abortController?.abort();
    const task = this.tasks.get(localId);

    if (task?.uploadId) {
      await this.apiClient.cancel(task.uploadId);
    }

    this.patchStatus(localId, "cancelled");
  }

  getConcurrencyLimit(): number {
    return this.maxConcurrentTransfers;
  }

  private patchStatus(localId: string, status: UploadTaskSnapshot["status"]): void {
    this.patchTask(localId, { status });
  }

  private patchTask(localId: string, patch: Partial<UploadTaskSnapshot>): UploadTaskSnapshot {
    const task = this.tasks.get(localId);

    if (!task) {
      throw new Error(`Upload task ${localId} does not exist.`);
    }

    const updated = {
      ...task,
      ...patch,
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(localId, updated);
    this.notify();
    return updated;
  }

  private async uploadMissingChunks(localId: string, runtime: TaskRuntime, signal: AbortSignal): Promise<void> {
    const task = this.tasks.get(localId);

    if (!task?.uploadId || !runtime.source.slice) {
      return;
    }

    const uploaded = new Set(task.uploadedChunkIndexes);
    const chunks = createChunkDescriptors(task.file.size, this.chunkSize).filter((chunk) => !uploaded.has(chunk.index));
    let cursor = 0;

    const worker = async () => {
      while (cursor < chunks.length && !signal.aborted) {
        const chunk = chunks[cursor];
        cursor += 1;

        if (!chunk) {
          return;
        }

        await this.uploadChunkWithRetry(localId, runtime, task.uploadId ?? "", chunk.index, chunk.start, chunk.end, signal);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(this.maxConcurrentTransfers, chunks.length) }, () => worker())
    );
  }

  private async uploadChunkWithRetry(
    localId: string,
    runtime: TaskRuntime,
    uploadId: string,
    chunkIndex: number,
    start: number,
    end: number,
    signal: AbortSignal
  ): Promise<void> {
    let attempt = 0;

    while (!signal.aborted) {
      try {
        const chunk = runtime.source.slice?.(start, end);

        if (!chunk) {
          throw new Error("Selected file cannot be sliced into upload chunks.");
        }

        await this.apiClient.uploadChunk(uploadId, chunkIndex, chunk, signal);
        this.markChunkUploaded(localId, chunkIndex);
        return;
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }

        attempt += 1;
        this.markChunkFailed(localId, chunkIndex, attempt);

        if (!canRetry(attempt, this.maxRetriesPerChunk)) {
          throw error;
        }

        this.patchTask(localId, { status: "retrying" });
        await delay(this.retryDelayMs(attempt), signal);
        this.patchTask(localId, { status: "uploading" });
      }
    }
  }

  private markChunkUploaded(localId: string, chunkIndex: number): void {
    const task = this.tasks.get(localId);

    if (!task) {
      return;
    }

    const uploadedChunkIndexes = Array.from(new Set([...task.uploadedChunkIndexes, chunkIndex])).sort((a, b) => a - b);
    this.patchTask(localId, {
      status: "uploading",
      uploadedChunkIndexes,
      progress: progressFromUploadedChunks(task.file.size, this.chunkSize, uploadedChunkIndexes)
    });
  }

  private markChunkFailed(localId: string, chunkIndex: number, attempt: number): void {
    const task = this.tasks.get(localId);

    if (!task) {
      return;
    }

    this.patchTask(localId, {
      failedChunks: {
        ...task.failedChunks,
        [chunkIndex]: attempt
      }
    });
  }

  private failTask(localId: string, error: UploadTaskSnapshot["error"]): void {
    this.patchTask(localId, {
      status: "failed",
      error
    });
  }

  private notify(): void {
    const snapshots = this.listTasks();
    for (const listener of this.listeners) {
      listener(snapshots);
    }
  }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  if (ms === 0 || signal.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(new DOMException("Upload aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function progressFromUploadedChunks(fileSize: number, chunkSize: number, uploadedChunkIndexes: number[]) {
  const uploadedBytes = Math.min(uploadedChunkIndexes.length * chunkSize, fileSize);

  return {
    uploadedBytes,
    totalBytes: fileSize,
    percentage: fileSize === 0 ? 0 : Math.round((uploadedBytes / fileSize) * 100)
  };
}

function completeFileMetadata(file: UploadFileMetadata, uri: string, checksum: string): UploadFileMetadata {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    previewUri: file.previewUri,
    uri,
    checksum
  };
}

function getErrorCode(error: unknown) {
  if (hasUploadError(error)) {
    return error.error.code;
  }

  return "network_error";
}

function getErrorMessage(error: unknown): string {
  if (hasUploadError(error)) {
    return error.error.message;
  }

  return error instanceof Error ? error.message : "Upload failed.";
}

function getErrorRetryable(error: unknown): boolean {
  if (hasUploadError(error)) {
    return error.error.retryable;
  }

  return true;
}

function hasUploadError(error: unknown): error is { error: NonNullable<UploadTaskSnapshot["error"]> } {
  return typeof error === "object" && error !== null && "error" in error;
}
