import { UploadStatus, type UploadTaskSnapshot } from "@media-upload/shared-types";
import type { MobileUploadSummary } from "../types/upload";

export const summarizeTasks = (tasks: UploadTaskSnapshot[]): MobileUploadSummary => {
  const uploadedBytes = tasks.reduce((sum, task) => sum + task.progress.uploadedBytes, 0);
  const totalBytes = tasks.reduce((sum, task) => sum + task.progress.totalBytes, 0);

  return {
    queued: tasks.filter(
      (task) => task.status === UploadStatus.Queued || task.status === UploadStatus.Initializing
    ).length,
    active: tasks.filter(
      (task) =>
        task.status === UploadStatus.Uploading ||
        task.status === UploadStatus.Retrying ||
        task.status === UploadStatus.Finalizing
    ).length,
    completed: tasks.filter((task) => task.status === UploadStatus.Completed).length,
    failed: tasks.filter((task) => task.status === UploadStatus.Failed).length,
    uploadedBytes,
    totalBytes,
    percentage: totalBytes === 0 ? 0 : Math.round((uploadedBytes / totalBytes) * 100)
  };
};

export const areTaskListsEqual = (left: UploadTaskSnapshot[], right: UploadTaskSnapshot[]): boolean => {
  if (left.length !== right.length) return false;

  return left.every((task, index) => {
    const other = right[index];
    return (
      Boolean(other) &&
      task.localId === other.localId &&
      task.status === other.status &&
      task.updatedAt === other.updatedAt
    );
  });
};
