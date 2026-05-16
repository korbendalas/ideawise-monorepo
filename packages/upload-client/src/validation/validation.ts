import { MAX_FILES_PER_BATCH, UploadErrorCode, type UploadError } from "@media-upload/shared-types";
import type { ValidatableFile, ValidationOptions } from "./validation.types";

export const validateFiles = (files: ValidatableFile[], options: ValidationOptions): UploadError[] => {
  const errors: UploadError[] = [];
  const maxFiles = options.maxFiles ?? MAX_FILES_PER_BATCH;
  const allowedMimePrefixes = options.allowedMimePrefixes ?? ["image/", "video/"];

  if (files.length > maxFiles) {
    errors.push({
      code: UploadErrorCode.TooManyFiles,
      message: `Select up to ${maxFiles} files.`,
      retryable: false
    });
  }

  for (const file of files) {
    if (!allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix))) {
      errors.push({
        code: UploadErrorCode.InvalidType,
        message: `${file.name} is not an allowed image or video file.`,
        retryable: false
      });
    }

    if (file.size <= 0) {
      errors.push({
        code: UploadErrorCode.InvalidFileSize,
        message: "File must not be empty.",
        retryable: false
      });
    } else if (file.size > options.maxFileSizeBytes) {
      errors.push({
        code: UploadErrorCode.FileTooLarge,
        message: `${file.name} exceeds the configured size limit.`,
        retryable: false
      });
    }
  }

  return errors;
};
