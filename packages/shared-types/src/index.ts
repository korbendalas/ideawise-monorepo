export const CHUNK_SIZE_BYTES = 1024 * 1024;
export const MAX_CONCURRENT_TRANSFERS = 3;
export const MAX_RETRIES_PER_CHUNK = 3;
export const MAX_FILES_PER_BATCH = 10;

export type UploadStatus =
  | "queued"
  | "initializing"
  | "uploading"
  | "paused"
  | "retrying"
  | "finalizing"
  | "completed"
  | "failed"
  | "cancelled";

export type UploadErrorCode =
  | "invalid_type"
  | "file_too_large"
  | "too_many_files"
  | "network_error"
  | "chunk_rejected"
  | "rate_limited"
  | "server_validation_failed"
  | "cancelled";

export type UploadError = {
  code: UploadErrorCode;
  message: string;
  retryable: boolean;
};

export type UploadFileMetadata = {
  name: string;
  size: number;
  type: string;
  uri?: string;
  previewUri?: string;
  checksum?: string;
};

export type UploadTaskSnapshot = {
  localId: string;
  uploadId?: string;
  file: UploadFileMetadata;
  status: UploadStatus;
  chunkSize: number;
  totalChunks: number;
  uploadedChunkIndexes: number[];
  failedChunks: Record<number, number>;
  progress: {
    uploadedBytes: number;
    totalBytes: number;
    percentage: number;
  };
  error?: UploadError;
  createdAt: string;
  updatedAt: string;
};

export type InitiateUploadRequest = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum?: string;
  totalChunks: number;
  chunkSize: number;
};

export type InitiateUploadResponse = {
  uploadId: string | null;
  status: "initialized" | "completed";
  alreadyUploaded: boolean;
  uploadedChunkIndexes: number[];
  maxConcurrentChunks: number;
  chunkSize: number;
  file?: UploadedFileDto;
};

export type UploadedFileDto = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  checksum: string;
  url: string;
};

export type UploadStatusResponse = {
  uploadId: string;
  status: "initialized" | "uploading" | "finalizing" | "completed" | "failed" | "cancelled" | "expired";
  fileName: string;
  totalChunks: number;
  receivedChunks: number;
  uploadedChunkIndexes: number[];
  expiresAt: string;
};
