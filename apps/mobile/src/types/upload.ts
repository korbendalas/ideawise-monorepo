import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import type { UploadSource } from "@media-upload/upload-client";
import type { StatusBannerTone } from "../components/StatusBanner/StatusBanner.types";

export type MobileUploadSummary = {
  queued: number;
  active: number;
  completed: number;
  failed: number;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
};

export type MobileUploadManagerState = {
  tasks: UploadTaskSnapshot[];
  activeTasks: UploadTaskSnapshot[];
  completedTasks: UploadTaskSnapshot[];
  completedHistory: UploadTaskSnapshot[];
  draftCount: number;
  summary: MobileUploadSummary;
  queueFiles: (sources: UploadSource[]) => UploadTaskSnapshot[];
  pause: (localId: string) => void;
  resume: (localId: string) => void;
  cancel: (localId: string) => Promise<void>;
};

export type BannerState = {
  tone: StatusBannerTone;
  title: string;
  message: string;
};
