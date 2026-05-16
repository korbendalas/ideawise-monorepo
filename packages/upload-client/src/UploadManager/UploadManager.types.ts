import type { ApiClient } from "../ApiClient/ApiClient";
import type { UploadFileMetadata, UploadTaskSnapshot } from "@media-upload/shared-types";

export type UploadApi = Pick<ApiClient, "initiate" | "uploadChunk" | "finalize" | "cancel">;

export type UploadSource = UploadFileMetadata & {
  slice?: (start: number, end: number) => Blob;
};

export type UploadManagerOptions = {
  chunkSize?: number;
  maxConcurrentTransfers?: number;
  maxRetriesPerChunk?: number;
  apiClient?: UploadApi;
  retryDelayMs?: (attempt: number) => number;
};

export type TaskRuntime = {
  source: UploadSource;
  abortController?: AbortController;
  started: boolean;
};

export type UploadTaskListener = (tasks: UploadTaskSnapshot[]) => void;
