import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateFiles } from "./validation";

describe("validateFiles", () => {
  it("returns invalid_file_size for empty files", () => {
    const errors = validateFiles([{ name: "empty.jpg", size: 0, type: "image/jpeg" }], {
      maxFileSizeBytes: 100
    });

    assert.equal(errors[0]?.code, "invalid_file_size");
  });

  it("returns file_too_large for files over the configured limit", () => {
    const errors = validateFiles([{ name: "huge.mp4", size: 101, type: "video/mp4" }], {
      maxFileSizeBytes: 100
    });

    assert.equal(errors[0]?.code, "file_too_large");
  });
});
