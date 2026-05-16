export interface UploadSummary {
  queued: number;
  active: number;
  completed: number;
  failed: number;
  totalBytes: number;
  uploadedBytes: number;
}
