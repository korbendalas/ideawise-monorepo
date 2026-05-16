import {
  UploadStatus,
  type UploadTaskSnapshot,
} from "@media-upload/shared-types";
import { StatusBannerTone } from "../../components/StatusBanner";
import type { BannerState } from "../../types/upload";

export const getResumeAvailableBanner = (draftCount: number): BannerState => ({
  tone: StatusBannerTone.Info,
  title: "Resume available",
  message: `${draftCount} incomplete upload${draftCount === 1 ? "" : "s"} can be resumed from the queue.`,
});

export const getFailedTaskBanner = (
  tasks: UploadTaskSnapshot[],
): BannerState | null => {
  const failedTask = tasks.find(
    (task) => task.status === UploadStatus.Failed && task.error,
  );
  if (!failedTask?.error) return null;

  return {
    tone: failedTask.error.retryable
      ? StatusBannerTone.Warning
      : StatusBannerTone.Danger,
    title: failedTask.error.retryable ? "Upload interrupted" : "Upload failed",
    message: failedTask.error.message,
  };
};
