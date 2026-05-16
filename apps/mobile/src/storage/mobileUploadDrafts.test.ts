import assert from "node:assert/strict";
import { test } from "node:test";
import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import {
  deserializeMobileUploadDrafts,
  mergeMobileUploadDrafts,
  serializeMobileUploadDrafts
} from "./mobileUploadDrafts";

function task(localId: string, status: UploadTaskSnapshot["status"], uri?: string): UploadTaskSnapshot {
  return {
    localId,
    uploadId: `upload-${localId}`,
    file: { name: `${localId}.mp4`, size: 20, type: "video/mp4", uri, previewUri: uri },
    status,
    chunkSize: 1048576,
    totalChunks: 1,
    uploadedChunkIndexes: status === "queued" ? [] : [0],
    failedChunks: {},
    progress: { uploadedBytes: status === "queued" ? 0 : 20, totalBytes: 20, percentage: status === "queued" ? 0 : 100 },
    createdAt: "2026-05-15T10:00:00.000Z",
    updatedAt: "2026-05-15T10:00:00.000Z"
  };
}

test("serializes only resumable tasks with file uris", () => {
  const serialized = serializeMobileUploadDrafts([
    task("queued", "queued", "file://queued.mp4"),
    task("completed", "completed", "file://completed.mp4"),
    task("missing-uri", "paused")
  ]);

  const drafts = deserializeMobileUploadDrafts(serialized);

  assert.deepEqual(
    drafts.map((draft) => draft.localId),
    ["queued"]
  );
});

test("merge keeps latest draft and applies the limit", () => {
  const merged = mergeMobileUploadDrafts(
    [
      { ...deserializeMobileUploadDrafts(serializeMobileUploadDrafts([task("a", "paused", "file://a.mp4")]))[0]!, updatedAt: "2026-05-15T09:00:00.000Z" }
    ],
    [
      { ...deserializeMobileUploadDrafts(serializeMobileUploadDrafts([task("a", "failed", "file://a.mp4")]))[0]!, updatedAt: "2026-05-15T11:00:00.000Z" },
      deserializeMobileUploadDrafts(serializeMobileUploadDrafts([task("b", "queued", "file://b.mp4")]))[0]!
    ],
    1
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.localId, "a");
  assert.equal(merged[0]?.status, "failed");
});
