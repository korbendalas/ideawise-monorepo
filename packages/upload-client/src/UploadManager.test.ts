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

  it("keeps browser File metadata when the upload completes", async () => {
    const api = new FakeApiClient();
    const manager = new UploadManager({ apiClient: api });
    const file = Object.assign(new File(["image"], "browser-file.jpg", { type: "image/jpeg" }), {
      previewUri: "blob:browser-file.jpg"
    });

    const task = manager.addFile(file);
    await manager.start(task.localId);

    const completed = manager.getTask(task.localId);
    assert.equal(completed?.status, "completed");
    assert.equal(completed?.file.name, "browser-file.jpg");
    assert.equal(completed?.file.size, 5);
    assert.equal(completed?.file.type, "image/jpeg");
    assert.equal(completed?.file.previewUri, "blob:browser-file.jpg");
    assert.equal(completed?.file.uri, "/media/clip.jpg");
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

  it("creates local ids without browser crypto support", () => {
    const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");

    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: undefined
    });

    try {
      const manager = new UploadManager({ apiClient: new FakeApiClient() });
      const task = manager.addFile(createSource("phone.jpg", 12));

      assert.match(task.localId, /^upload-/);
      assert.equal(manager.getTask(task.localId)?.file.name, "phone.jpg");
    } finally {
      if (cryptoDescriptor) {
        Object.defineProperty(globalThis, "crypto", cryptoDescriptor);
      }
    }
  });

  it("keeps local cancellation when remote cancellation fails", async () => {
    const api = new FakeApiClient({ failCancel: true });
    const manager = new UploadManager({ apiClient: api });
    const task = manager.addFile(createSource("clip.jpg", CHUNK_SIZE_BYTES + 12));

    await manager.start(task.localId);
    await manager.cancel(task.localId);

    assert.equal(manager.getTask(task.localId)?.status, "cancelled");
  });

  it("ignores duplicate start calls while an upload is already active", async () => {
    const api = new FakeApiClient({ holdChunks: true });
    const manager = new UploadManager({ apiClient: api });
    const task = manager.addFile(createSource("clip.jpg", CHUNK_SIZE_BYTES + 12));

    const firstUpload = manager.start(task.localId);
    await api.waitForChunkStart();
    await manager.start(task.localId);
    manager.pause(task.localId);
    await firstUpload;

    assert.equal(api.initiateCalls, 1);
    assert.deepEqual(api.uploadedChunks, []);
    assert.equal(manager.getTask(task.localId)?.status, "paused");
  });

  it("counts uploaded bytes from each uploaded chunk index", async () => {
    const api = new FakeApiClient({ alreadyUploadedChunkIndexes: [1], holdChunks: true });
    const manager = new UploadManager({ apiClient: api });
    const fileSize = CHUNK_SIZE_BYTES + CHUNK_SIZE_BYTES / 2;
    const task = manager.addFile(createSource("clip.jpg", fileSize));

    const upload = manager.start(task.localId);
    await api.waitForChunkStart();

    assert.equal(manager.getTask(task.localId)?.progress.uploadedBytes, CHUNK_SIZE_BYTES / 2);
    assert.equal(manager.getTask(task.localId)?.progress.percentage, 33);

    manager.pause(task.localId);
    await upload;
  });

  it("ignores status updates for unknown local tasks", () => {
    const manager = new UploadManager({ apiClient: new FakeApiClient() });

    assert.doesNotThrow(() => manager.pause("missing-task"));
  });
});

class FakeApiClient {
  uploadedChunks: number[] = [];
  chunkAttempts: Record<number, number> = {};
  initiateCalls = 0;
  private readonly failChunkOnce?: number;
  private readonly failCancel: boolean;
  private readonly holdChunks: boolean;
  private readonly alreadyUploadedChunkIndexes: number[];
  private chunkStarted?: () => void;
  private readonly chunkStartedPromise = new Promise<void>((resolve) => {
    this.chunkStarted = resolve;
  });

  constructor(
    options: {
      alreadyUploadedChunkIndexes?: number[];
      failCancel?: boolean;
      failChunkOnce?: number;
      holdChunks?: boolean;
    } = {}
  ) {
    this.alreadyUploadedChunkIndexes = options.alreadyUploadedChunkIndexes ?? [];
    this.failCancel = options.failCancel ?? false;
    this.failChunkOnce = options.failChunkOnce;
    this.holdChunks = options.holdChunks ?? false;
  }

  async initiate() {
    this.initiateCalls += 1;

    return {
      uploadId: "0123456789abcdef0123456789abcdef",
      status: "initialized" as const,
      alreadyUploaded: false,
      uploadedChunkIndexes: this.alreadyUploadedChunkIndexes,
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
      const error = new Error("Upload aborted");
      error.name = "AbortError";
      throw error;
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
    if (this.failCancel) {
      throw new Error("remote cancel failed");
    }

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
