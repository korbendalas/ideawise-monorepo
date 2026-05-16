import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UploadStatus, type UploadTaskSnapshot } from "@media-upload/shared-types";
import { getTaskPreviewImageSrc } from "./TaskRow.utils";

describe("getTaskPreviewImageSrc", () => {
  it("uses the completed media URL for image thumbnails when local preview state is gone", () => {
    const task = completedImageTask({
      previewUri: undefined,
      uri: "/media/2026/05/16/file.jpg"
    });

    assert.equal(getTaskPreviewImageSrc(task), "/media/2026/05/16/file.jpg");
  });

  it("keeps local previews for active image uploads before a media URL exists", () => {
    const task = {
      ...completedImageTask({
        previewUri: "blob:local-preview",
        uri: undefined
      }),
      status: UploadStatus.Uploading
    };

    assert.equal(getTaskPreviewImageSrc(task), "blob:local-preview");
  });

  it("does not render image thumbnails for videos", () => {
    const task = {
      ...completedImageTask({
        previewUri: "blob:video-preview",
        uri: "/media/video.mp4"
      }),
      file: {
        ...completedImageTask({}).file,
        type: "video/mp4"
      }
    };

    assert.equal(getTaskPreviewImageSrc(task), undefined);
  });
});

function completedImageTask(file: Partial<UploadTaskSnapshot["file"]>): UploadTaskSnapshot {
  return {
    localId: "local-1",
    file: {
      name: "file.jpg",
      size: 1024,
      type: "image/jpeg",
      ...file
    },
    status: UploadStatus.Completed,
    chunkSize: 1048576,
    totalChunks: 1,
    uploadedChunkIndexes: [0],
    failedChunks: {},
    progress: {
      uploadedBytes: 1024,
      totalBytes: 1024,
      percentage: 100
    },
    createdAt: "2026-05-16T00:00:00.000Z",
    updatedAt: "2026-05-16T00:00:00.000Z"
  };
}
