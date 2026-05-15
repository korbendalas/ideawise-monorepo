import {
  CHUNK_SIZE_BYTES,
  MAX_CONCURRENT_TRANSFERS,
  type UploadFileMetadata,
  type UploadTaskSnapshot
} from "@media-upload/shared-types";
import { getTotalChunks } from "./chunking";

export type UploadManagerOptions = {
  chunkSize?: number;
  maxConcurrentTransfers?: number;
};

export class UploadManager {
  private readonly chunkSize: number;
  private readonly maxConcurrentTransfers: number;
  private readonly tasks = new Map<string, UploadTaskSnapshot>();

  constructor(options: UploadManagerOptions = {}) {
    this.chunkSize = options.chunkSize ?? CHUNK_SIZE_BYTES;
    this.maxConcurrentTransfers = options.maxConcurrentTransfers ?? MAX_CONCURRENT_TRANSFERS;
  }

  addFile(file: UploadFileMetadata): UploadTaskSnapshot {
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
    return task;
  }

  listTasks(): UploadTaskSnapshot[] {
    return Array.from(this.tasks.values());
  }

  pause(localId: string): void {
    this.patchStatus(localId, "paused");
  }

  resume(localId: string): void {
    this.patchStatus(localId, "queued");
  }

  cancel(localId: string): void {
    this.patchStatus(localId, "cancelled");
  }

  getConcurrencyLimit(): number {
    return this.maxConcurrentTransfers;
  }

  private patchStatus(localId: string, status: UploadTaskSnapshot["status"]): void {
    const task = this.tasks.get(localId);

    if (!task) {
      return;
    }

    this.tasks.set(localId, {
      ...task,
      status,
      updatedAt: new Date().toISOString()
    });
  }
}
