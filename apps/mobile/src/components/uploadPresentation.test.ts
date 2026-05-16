import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBytes, getAvailableActions, getStatusTone } from "./uploadPresentation";

test("formatBytes uses readable units", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1024), "1 KB");
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(5 * 1024 * 1024), "5 MB");
});

test("getAvailableActions exposes controls for active upload states", () => {
  assert.deepEqual(getAvailableActions("uploading"), ["pause", "cancel"]);
  assert.deepEqual(getAvailableActions("paused"), ["resume", "cancel"]);
  assert.deepEqual(getAvailableActions("failed"), ["resume", "cancel"]);
  assert.deepEqual(getAvailableActions("completed"), []);
  assert.deepEqual(getAvailableActions("cancelled"), []);
});

test("getStatusTone categorizes status severity", () => {
  assert.equal(getStatusTone("completed"), "success");
  assert.equal(getStatusTone("failed"), "danger");
  assert.equal(getStatusTone("retrying"), "warning");
  assert.equal(getStatusTone("uploading"), "info");
});
