import type { UploadTaskSnapshot } from "@media-upload/shared-types";

export type UploadQueueProps = {
  activeTasks: UploadTaskSnapshot[];
  completedTasks: UploadTaskSnapshot[];
  onPause: (localId: string) => void;
  onResume: (localId: string) => void;
  onCancel: (localId: string) => void;
};
