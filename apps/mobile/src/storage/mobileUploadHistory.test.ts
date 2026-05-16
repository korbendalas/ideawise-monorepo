import assert from "node:assert/strict";
import { test } from "node:test";
import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import {
  deserializeMobileUploadHistory,
  mergeMobileUploadHistory,
  serializeMobileUploadHistory
} from "./mobileUploadHistory";

function task(localId: string, updatedAt: string, status: UploadTaskSnapshot["status"] = "completed"): UploadTaskSnapshot {
  return {
    localId,
    file: { name: `${localId}.jpg`, size: 10, type: "image/jpeg", previewUri: "file://preview.jpg" },
    status,
    chunkSize: 1048576,
    totalChunks: 1,
    uploadedChunkIndexes: [0],
    failedChunks: {},
    progress: { uploadedBytes: 10, totalBytes: 10, percentage: 100 },
    createdAt: updatedAt,
    updatedAt
  };
}

test("serializes and deserializes completed upload history", () => {
  const serialized = serializeMobileUploadHistory([
    task("a", "2026-05-15T10:00:00.000Z"),
    task("b", "2026-05-15T10:01:00.000Z", "failed")
  ]);

  const deserialized = deserializeMobileUploadHistory(serialized);

  assert.equal(deserialized.length, 1);
  assert.equal(deserialized[0]?.localId, "a");
});

test("merge de-duplicates by local id and keeps newest items first", () => {
  const merged = mergeMobileUploadHistory(
    [task("a", "2026-05-15T10:00:00.000Z")],
    [task("a", "2026-05-15T11:00:00.000Z"), task("b", "2026-05-15T09:00:00.000Z")],
    10
  );

  assert.deepEqual(
    merged.map((item) => item.localId),
    ["a", "b"]
  );
  assert.equal(merged[0]?.updatedAt, "2026-05-15T11:00:00.000Z");
});

test("deserialize returns an empty list for invalid JSON", () => {
  assert.deepEqual(deserializeMobileUploadHistory("{not-json"), []);
});
