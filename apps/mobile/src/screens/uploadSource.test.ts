import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePickerAsset } from "./uploadSource";

describe("normalizePickerAsset", () => {
  it("maps Expo image picker assets to upload sources", () => {
    assert.deepEqual(
      normalizePickerAsset({
        uri: "file:///tmp/photo.jpg",
        fileName: "photo.jpg",
        fileSize: 2048,
        mimeType: "image/jpeg"
      }),
      {
        name: "photo.jpg",
        size: 2048,
        type: "image/jpeg",
        uri: "file:///tmp/photo.jpg",
        previewUri: "file:///tmp/photo.jpg"
      }
    );
  });

  it("falls back to a URI file name and inferred MIME type", () => {
    assert.deepEqual(
      normalizePickerAsset({
        uri: "file:///tmp/clip.mp4",
        fileSize: 4096
      }),
      {
        name: "clip.mp4",
        size: 4096,
        type: "video/mp4",
        uri: "file:///tmp/clip.mp4",
        previewUri: "file:///tmp/clip.mp4"
      }
    );
  });

  it("uses blob size and blob MIME type when picker metadata is missing", () => {
    const blob = new Blob(["hello"], { type: "image/png" });
    const source = normalizePickerAsset(
      {
        uri: "file:///camera/capture.png",
        fileSize: null,
        mimeType: null
      },
      blob
    );

    assert.equal(source.name, "capture.png");
    assert.equal(source.size, 5);
    assert.equal(source.type, "image/png");
    assert.equal(typeof source.slice, "function");
  });

  it("falls back to safe default name and type", () => {
    const source = normalizePickerAsset({
      uri: "file:///asset-without-extension",
      fileName: null,
      mimeType: null
    });

    assert.equal(source.name, "selected-media");
    assert.equal(source.type, "application/octet-stream");
  });
});
