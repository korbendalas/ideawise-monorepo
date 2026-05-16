import type { UploadStatus } from "@media-upload/shared-types";

export type UploadAction = "pause" | "resume" | "cancel";
export type UploadTone = "info" | "success" | "warning" | "danger" | "muted";

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const formatted = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);

  return `${formatted} ${units[exponent]}`;
}

export function getAvailableActions(status: UploadStatus): UploadAction[] {
  if (status === "paused" || status === "failed") {
    return ["resume", "cancel"];
  }

  if (status === "queued" || status === "initializing" || status === "uploading" || status === "retrying" || status === "finalizing") {
    return ["pause", "cancel"];
  }

  return [];
}

export function getStatusTone(status: UploadStatus): UploadTone {
  if (status === "completed") {
    return "success";
  }

  if (status === "failed" || status === "cancelled") {
    return "danger";
  }

  if (status === "retrying" || status === "paused") {
    return "warning";
  }

  if (status === "queued") {
    return "muted";
  }

  return "info";
}

export function humanizeStatus(status: UploadStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
