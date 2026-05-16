import { UploadStatus, type UploadStatus as UploadStatusType } from "@media-upload/shared-types";


export const UploadAction = {
  Pause: "pause",
  Resume: "resume",
  Cancel: "cancel"
} as const;

export type UploadAction = (typeof UploadAction)[keyof typeof UploadAction];


export const UploadTone = {
  Info: "info",
  Success: "success",
  Warning: "warning",
  Danger: "danger",
  Muted: "muted"
} as const;

export type UploadTone = (typeof UploadTone)[keyof typeof UploadTone];


export const getAvailableActions = (status: UploadStatusType): UploadAction[] => {
  if (status === UploadStatus.Paused || status === UploadStatus.Failed) {
    return [UploadAction.Resume, UploadAction.Cancel];
  }

  if (
    status === UploadStatus.Queued ||
    status === UploadStatus.Initializing ||
    status === UploadStatus.Uploading ||
    status === UploadStatus.Retrying ||
    status === UploadStatus.Finalizing
  ) {
    return [UploadAction.Pause, UploadAction.Cancel];
  }

  return [];
};

export const getStatusTone = (status: UploadStatusType): UploadTone => {
  if (status === UploadStatus.Completed) return UploadTone.Success;
  if (status === UploadStatus.Failed || status === UploadStatus.Cancelled) return UploadTone.Danger;
  if (status === UploadStatus.Retrying || status === UploadStatus.Paused) return UploadTone.Warning;
  if (status === UploadStatus.Queued) return UploadTone.Muted;
  return UploadTone.Info;
};

export const humanizeStatus = (status: UploadStatusType): string =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
