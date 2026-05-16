import type { UploadManager } from "@media-upload/upload-client";
import type { UploadTaskSnapshot } from "@media-upload/shared-types";

export interface TaskListProps {
  tasks: UploadTaskSnapshot[];
  manager: UploadManager;
  emptyLabel: string;
}
