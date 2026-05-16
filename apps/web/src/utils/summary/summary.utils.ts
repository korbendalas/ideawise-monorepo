import { UploadStatus, type UploadTaskSnapshot } from "@media-upload/shared-types";
import type { UploadSummary } from "./summary.types";

export const getSummary = (tasks: UploadTaskSnapshot[]): UploadSummary =>
  tasks.reduce(
    (summary, task) => {
      summary.totalBytes += task.progress.totalBytes;
      summary.uploadedBytes += task.progress.uploadedBytes;

      if (task.status === UploadStatus.Queued) {
        summary.queued += 1;
      }

      if (
        task.status === UploadStatus.Initializing ||
        task.status === UploadStatus.Uploading ||
        task.status === UploadStatus.Retrying ||
        task.status === UploadStatus.Finalizing
      ) {
        summary.active += 1;
      }

      if (task.status === UploadStatus.Completed) {
        summary.completed += 1;
      }

      if (task.status === UploadStatus.Failed) {
        summary.failed += 1;
      }

      return summary;
    },
    { queued: 0, active: 0, completed: 0, failed: 0, totalBytes: 0, uploadedBytes: 0 }
  );
