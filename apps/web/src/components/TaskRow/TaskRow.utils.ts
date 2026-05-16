import { UploadStatus, type UploadTaskSnapshot } from "@media-upload/shared-types";

export const getTaskPreviewImageSrc = (task: UploadTaskSnapshot): string | undefined => {
  if (!task.file.type.startsWith("image/")) {
    return undefined;
  }

  if (task.status === UploadStatus.Completed) {
    return task.file.uri ?? task.file.previewUri;
  }

  return task.file.previewUri ?? task.file.uri;
};
