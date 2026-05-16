import type {
  UploadStatus,
  UploadTaskSnapshot,
} from "@media-upload/shared-types";

export type UploadTaskCardProps = {
  task: UploadTaskSnapshot;
  onPause: (localId: string) => void;
  onResume: (localId: string) => void;
  onCancel: (localId: string) => void;
};

export type UploadTaskPreviewProps = {
  previewUri?: string;
  fileType: string;
};

export type UploadTaskMetaProps = {
  task: UploadTaskSnapshot;
};

export type UploadTaskProgressProps = {
  percentage: number;
};

export type UploadTaskActionsProps = {
  localId: string;
  status: UploadStatus;
  onPause: (localId: string) => void;
  onResume: (localId: string) => void;
  onCancel: (localId: string) => void;
};
