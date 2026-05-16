import assert from "node:assert/strict";
import { test } from "node:test";
import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import { mergeCompletedHistoryState, summarizeTasks } from "./useUploadManager";

function task(status: UploadTaskSnapshot["status"], uploadedBytes: number, totalBytes: number): UploadTaskSnapshot {
  return {
    localId: `${status}-${uploadedBytes}`,
    file: { name: "file.jpg", size: totalBytes, type: "image/jpeg" },
    status,
    chunkSize: 1048576,
    totalChunks: 1,
    uploadedChunkIndexes: uploadedBytes === totalBytes ? [0] : [],
    failedChunks: {},
    progress: {
      uploadedBytes,
      totalBytes,
      percentage: totalBytes === 0 ? 0 : Math.round((uploadedBytes / totalBytes) * 100)
    },
    createdAt: "2026-05-15T10:00:00.000Z",
    updatedAt: "2026-05-15T10:00:00.000Z"
  };
}

test("summarizeTasks groups mobile upload statuses", () => {
  const summary = summarizeTasks([
    task("queued", 0, 100),
    task("uploading", 50, 100),
    task("completed", 100, 100),
    task("failed", 20, 100)
  ]);

  assert.equal(summary.queued, 1);
  assert.equal(summary.active, 1);
  assert.equal(summary.completed, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.percentage, 43);
});

test("mergeCompletedHistoryState preserves the current array when completed history is unchanged", () => {
  const completed = task("completed", 100, 100);
  const currentHistory = [completed];

  const merged = mergeCompletedHistoryState(currentHistory, [completed], 25);

  assert.equal(merged, currentHistory);
});
