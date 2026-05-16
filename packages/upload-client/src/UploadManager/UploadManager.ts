import {
  CHUNK_SIZE_BYTES,
  MAX_CONCURRENT_TRANSFERS,
  MAX_RETRIES_PER_CHUNK,
  UploadErrorCode,
  UploadStatus,
  type UploadTaskSnapshot
} from "@media-upload/shared-types";
import { createChunkDescriptors, getTotalChunks } from "../chunking/chunking";
import { ApiClient } from "../ApiClient/ApiClient";
import { canRetry, getRetryDelayMs } from "../retry/retry";
import type { UploadApi, UploadManagerOptions, UploadSource, TaskRuntime, UploadTaskListener } from "./UploadManager.types";
import {
  createLocalId,
  delay,
  isAbortError,
  throwIfAborted,
  progressFromUploadedChunks,
  completeFileMetadata,
  getErrorCode,
  getErrorMessage,
  getErrorRetryable,
  withoutUndefined
} from "./UploadManager.utils";

const activeStatuses: UploadStatus[] = [
  UploadStatus.Initializing,
  UploadStatus.Uploading,
  UploadStatus.Retrying,
  UploadStatus.Finalizing
];

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

  // UploadApi event: local queue setup, before initiate.
  // Adds files to queue.
  addFile(file: UploadSource): UploadTaskSnapshot {
    const now = new Date().toISOString();
    const localId = createLocalId();
    const task: UploadTaskSnapshot = {
      localId,
      file,
      status: UploadStatus.Queued,
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

  // UploadApi events: initiate, uploadChunk, and finalize.
  async start(localId: string): Promise<void> {
    const runtime = this.runtimes.get(localId);
    const task = this.tasks.get(localId);

    if (!runtime || !task || task.status === UploadStatus.Completed || task.status === UploadStatus.Cancelled) {
      return;
    }

    if (runtime.started && activeStatuses.includes(task.status)) {
      return;
    }

    if (!runtime.source.slice) {
      this.failTask(localId, {
        code: UploadErrorCode.InvalidType,
        message: "Selected file cannot be sliced into upload chunks.",
        retryable: false
      });
      return;
    }

    const abortController = new AbortController();
    runtime.abortController = abortController;
    runtime.started = true;

    try {
      let current = this.patchTask(localId, {
        status: task.uploadId ? UploadStatus.Uploading : UploadStatus.Initializing
      });
      if (!current) {
        return;
      }

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
          this.patchTask(localId, withoutUndefined({
            uploadId: initiated.uploadId ?? undefined,
            status: UploadStatus.Completed,
            uploadedChunkIndexes: Array.from({ length: current.totalChunks }, (_, index) => index),
            progress: {
              uploadedBytes: current.file.size,
              totalBytes: current.file.size,
              percentage: 100
            },
            file: completeFileMetadata(current.file, initiated.file.url, initiated.file.checksum)
          }));
          return;
        }

        current = this.patchTask(localId, withoutUndefined({
          uploadId: initiated.uploadId ?? undefined,
          status: UploadStatus.Uploading,
          uploadedChunkIndexes: initiated.uploadedChunkIndexes,
          progress: progressFromUploadedChunks(current.file.size, this.chunkSize, initiated.uploadedChunkIndexes)
        }));
        if (!current) {
          return;
        }
      }

      await this.uploadMissingChunks(localId, runtime, abortController.signal);

      current = this.tasks.get(localId) ?? current;
      if (current.status === UploadStatus.Paused || current.status === UploadStatus.Cancelled) {
        return;
      }

      this.patchTask(localId, { status: UploadStatus.Finalizing });
      const uploadedFile = await this.apiClient.finalize(current.uploadId ?? "", abortController.signal);
      this.patchTask(localId, {
        status: UploadStatus.Completed,
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
        if (this.tasks.get(localId)?.status !== UploadStatus.Cancelled) {
          this.patchTask(localId, { status: UploadStatus.Paused });
        }
        return;
      }

      this.failTask(localId, {
        code: getErrorCode(error),
        message: getErrorMessage(error),
        retryable: getErrorRetryable(error)
      });
    } finally {
      runtime.started = false;
      runtime.abortController = undefined;
    }
  }

  // UploadApi event: local task snapshot read.
  listTasks(): UploadTaskSnapshot[] {
    return Array.from(this.tasks.values());
  }

  // UploadApi event: local single-task snapshot read.
  getTask(localId: string): UploadTaskSnapshot | undefined {
    return this.tasks.get(localId);
  }

  // UploadApi event: local task snapshot subscription.
  subscribe(listener: UploadTaskListener): () => void {
    this.listeners.add(listener);
    listener(this.listTasks());

    return () => {
      this.listeners.delete(listener);
    };
  }

  // UploadApi event: local transfer pause.
  pause(localId: string): void {
    this.runtimes.get(localId)?.abortController?.abort();
    this.patchStatus(localId, UploadStatus.Paused);
  }

  // UploadApi events: resume local transfer, then continue uploadChunk/finalize.
  resume(localId: string): void {
    this.patchStatus(localId, UploadStatus.Queued);
    void this.start(localId);
  }

  // UploadApi event: cancel.
  async cancel(localId: string): Promise<void> {
    const runtime = this.runtimes.get(localId);
    runtime?.abortController?.abort();
    const task = this.tasks.get(localId);
    this.patchStatus(localId, UploadStatus.Cancelled);

    if (task?.uploadId) {
      try {
        await this.apiClient.cancel(task.uploadId);
      } catch {
        // Local cancellation is authoritative; remote cleanup may fail if the session already expired.
      }
    }
  }

  // UploadApi event: local concurrency configuration read.
  getConcurrencyLimit(): number {
    return this.maxConcurrentTransfers;
  }

  // UploadApi event: local status update.
  private patchStatus(localId: string, status: UploadTaskSnapshot["status"]): void {
    this.patchTask(localId, { status });
  }

  // UploadApi event: local task snapshot update.
  private patchTask(localId: string, patch: Partial<UploadTaskSnapshot>): UploadTaskSnapshot | undefined {
    const task = this.tasks.get(localId);

    if (!task) {
      return undefined;
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

  // UploadApi event: uploadChunk.
  private async uploadMissingChunks(localId: string, runtime: TaskRuntime, signal: AbortSignal): Promise<void> {
    const task = this.tasks.get(localId);

    if (!task?.uploadId || !runtime.source.slice) {
      return;
    }

    const uploaded = new Set(task.uploadedChunkIndexes);
    const chunks = createChunkDescriptors(task.file.size, this.chunkSize).filter((chunk) => !uploaded.has(chunk.index));
    let cursor = 0;

    const worker = async () => {
      while (cursor < chunks.length) {
        throwIfAborted(signal);
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

  // UploadApi event: uploadChunk.
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

    while (true) {
      throwIfAborted(signal);

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

        this.patchTask(localId, { status: UploadStatus.Retrying });
        await delay(this.retryDelayMs(attempt), signal);
        this.patchTask(localId, { status: UploadStatus.Uploading });
      }
    }
  }

  // UploadApi event: local uploadChunk success update.
  private markChunkUploaded(localId: string, chunkIndex: number): void {
    const task = this.tasks.get(localId);

    if (!task) {
      return;
    }

    const uploadedChunkIndexes = Array.from(new Set([...task.uploadedChunkIndexes, chunkIndex])).sort((a, b) => a - b);
    this.patchTask(localId, {
      status: UploadStatus.Uploading,
      uploadedChunkIndexes,
      progress: progressFromUploadedChunks(task.file.size, this.chunkSize, uploadedChunkIndexes)
    });
  }

  // UploadApi event: local uploadChunk retry/failure update.
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

  // UploadApi event: local failure update for initiate/uploadChunk/finalize.
  private failTask(localId: string, error: UploadTaskSnapshot["error"]): void {
    this.patchTask(localId, {
      status: UploadStatus.Failed,
      error
    });
  }

  // UploadApi event: local task snapshot notification.
  private notify(): void {
    const snapshots = this.listTasks();
    for (const listener of this.listeners) {
      listener(snapshots);
    }
  }
}
