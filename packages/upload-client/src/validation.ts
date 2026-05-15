import { MAX_FILES_PER_BATCH, type UploadError } from "@media-upload/shared-types";

export type ValidatableFile = {
  name: string;
  size: number;
  type: string;
};

export type ValidationOptions = {
  maxFiles?: number;
  maxFileSizeBytes: number;
  allowedMimePrefixes?: string[];
};

export function validateFiles(files: ValidatableFile[], options: ValidationOptions): UploadError[] {
  const errors: UploadError[] = [];
  const maxFiles = options.maxFiles ?? MAX_FILES_PER_BATCH;
  const allowedMimePrefixes = options.allowedMimePrefixes ?? ["image/", "video/"];

  if (files.length > maxFiles) {
    errors.push({
      code: "too_many_files",
      message: `Select up to ${maxFiles} files.`,
      retryable: false
    });
  }

  for (const file of files) {
    if (!allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix))) {
      errors.push({
        code: "invalid_type",
        message: `${file.name} is not an allowed image or video file.`,
        retryable: false
      });
    }

    if (file.size <= 0) {
      errors.push({
        code: "invalid_file_size",
        message: `${file.name} is empty and cannot be uploaded.`,
        retryable: false
      });
    } else if (file.size > options.maxFileSizeBytes) {
      errors.push({
        code: "file_too_large",
        message: `${file.name} exceeds the configured size limit.`,
        retryable: false
      });
    }
  }

  return errors;
}
