import type { UploadManager } from "@media-upload/upload-client";
import type { UploadTaskSnapshot } from "@media-upload/shared-types";

export interface TaskRowProps {
  task: UploadTaskSnapshot;
  manager: UploadManager;
}
