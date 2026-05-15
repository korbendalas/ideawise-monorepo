import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHUNK_SIZE_BYTES, type UploadedFileDto } from "@media-upload/shared-types";
import { UploadManager, type UploadSource } from "./UploadManager";

describe("UploadManager", () => {
  it("uploads chunks with progress snapshots and finalizes the file", async () => {
    const api = new FakeApiClient();
    const manager = new UploadManager({ apiClient: api });
    const seenStatuses: string[] = [];

    manager.subscribe((tasks) => {
      const task = tasks[0];
      if (task) {
        seenStatuses.push(task.status);
      }
    });

    const task = manager.addFile(createSource("clip.jpg", CHUNK_SIZE_BYTES + 12));
    await manager.start(task.localId);

    const completed = manager.getTask(task.localId);

    assert.deepEqual(api.uploadedChunks.sort(), [0, 1]);
    assert.equal(completed?.status, "completed");
    assert.equal(completed?.progress.percentage, 100);
    assert.equal(completed?.file.uri, "/media/clip.jpg");
    assert.ok(seenStatuses.includes("uploading"));
    assert.ok(seenStatuses.includes("finalizing"));
  });

  it("retries a failed chunk before marking upload complete", async () => {
    const api = new FakeApiClient({ failChunkOnce: 1 });
    const manager = new UploadManager({ apiClient: api, retryDelayMs: () => 0 });
    const task = manager.addFile(createSource("clip.jpg", CHUNK_SIZE_BYTES + 12));

    await manager.start(task.localId);

    assert.equal(api.chunkAttempts[1], 2);
    assert.equal(manager.getTask(task.localId)?.status, "completed");
  });

  it("pauses by aborting in-flight chunk uploads", async () => {
    const api = new FakeApiClient({ holdChunks: true });
    const manager = new UploadManager({ apiClient: api });
    const task = manager.addFile(createSource("clip.jpg", CHUNK_SIZE_BYTES + 12));

    const upload = manager.start(task.localId);
    await api.waitForChunkStart();
    manager.pause(task.localId);
    await upload;

    assert.equal(manager.getTask(task.localId)?.status, "paused");
  });
});

class FakeApiClient {
  uploadedChunks: number[] = [];
  chunkAttempts: Record<number, number> = {};
  private readonly failChunkOnce?: number;
  private readonly holdChunks: boolean;
  private chunkStarted?: () => void;
  private readonly chunkStartedPromise = new Promise<void>((resolve) => {
    this.chunkStarted = resolve;
  });

  constructor(options: { failChunkOnce?: number; holdChunks?: boolean } = {}) {
    this.failChunkOnce = options.failChunkOnce;
    this.holdChunks = options.holdChunks ?? false;
  }

  async initiate() {
    return {
      uploadId: "0123456789abcdef0123456789abcdef",
      status: "initialized" as const,
      alreadyUploaded: false,
      uploadedChunkIndexes: [],
      maxConcurrentChunks: 3,
      chunkSize: CHUNK_SIZE_BYTES
    };
  }

  async uploadChunk(_uploadId: string, chunkIndex: number, _chunk: Blob, signal?: AbortSignal) {
    this.chunkStarted?.();
    this.chunkAttempts[chunkIndex] = (this.chunkAttempts[chunkIndex] ?? 0) + 1;

    if (this.holdChunks) {
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }

    if (signal?.aborted) {
      throw new DOMException("Upload aborted", "AbortError");
    }

    if (this.failChunkOnce === chunkIndex && this.chunkAttempts[chunkIndex] === 1) {
      throw new Error("network down");
    }

    this.uploadedChunks.push(chunkIndex);
  }

  async finalize(): Promise<UploadedFileDto> {
    return {
      id: "media-1",
      fileName: "clip.jpg",
      mimeType: "image/jpeg",
      size: CHUNK_SIZE_BYTES + 12,
      checksum: "abc123",
      url: "/media/clip.jpg"
    };
  }

  async cancel() {
    return undefined;
  }

  waitForChunkStart() {
    return this.chunkStartedPromise;
  }
}

function createSource(name: string, size: number): UploadSource {
  return {
    name,
    size,
    type: "image/jpeg",
    previewUri: `blob:${name}`,
    slice: (start, end) => new Blob([new Uint8Array(end - start)])
  };
}
