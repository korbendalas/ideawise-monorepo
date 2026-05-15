import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import {
  deserializeCompletedTasks,
  mergeCompletedTasks,
  serializeCompletedTasks
} from "./uploadHistory";

describe("upload history persistence", () => {
  it("serializes completed tasks without browser-only file preview state", () => {
    const serialized = serializeCompletedTasks([completedTask("local-1", "/media/file.jpg")]);

    assert.equal(JSON.parse(serialized)[0].file.name, "file.jpg");
    assert.equal(JSON.parse(serialized)[0].file.previewUri, undefined);
  });

  it("serializes completed browser File objects with stable metadata", () => {
    const browserFile = Object.assign(new File(["media"], "browser-file.jpg", { type: "image/jpeg" }), {
      uri: "/media/browser-file.jpg",
      previewUri: "blob:temporary"
    });
    const task = {
      ...completedTask("local-browser-file", "/media/browser-file.jpg"),
      file: browserFile
    };

    const [serializedTask] = JSON.parse(serializeCompletedTasks([task]));

    assert.equal(serializedTask.file.name, "browser-file.jpg");
    assert.equal(serializedTask.file.size, 5);
    assert.equal(serializedTask.file.type, "image/jpeg");
    assert.equal(serializedTask.file.uri, "/media/browser-file.jpg");
    assert.equal(serializedTask.file.previewUri, undefined);
  });

  it("loads only completed tasks from persisted JSON", () => {
    const loaded = deserializeCompletedTasks(
      JSON.stringify([completedTask("local-1", "/media/file.jpg"), { ...completedTask("local-2"), status: "failed" }])
    );

    assert.deepEqual(
      loaded.map((task) => task.localId),
      ["local-1"]
    );
  });

  it("merges live completed tasks over persisted history by media URL", () => {
    const persisted = [completedTask("old-local", "/media/file.jpg"), completedTask("persisted-only", "/media/old.jpg")];
    const live = [completedTask("fresh-local", "/media/file.jpg")];

    assert.deepEqual(
      mergeCompletedTasks(persisted, live).map((task) => task.localId),
      ["fresh-local", "persisted-only"]
    );
  });
});

function completedTask(localId: string, uri = "/media/file.jpg"): UploadTaskSnapshot {
  return {
    localId,
    file: {
      name: "file.jpg",
      size: 516,
      type: "image/jpeg",
      uri,
      previewUri: "blob:temporary"
    },
    status: "completed",
    chunkSize: 1048576,
    totalChunks: 1,
    uploadedChunkIndexes: [0],
    failedChunks: {},
    progress: {
      uploadedBytes: 516,
      totalBytes: 516,
      percentage: 100
    },
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z"
  };
}
