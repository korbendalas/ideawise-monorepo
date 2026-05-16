import {
  UploadErrorCode,
  type UploadFileMetadata,
  type UploadTaskSnapshot
} from "@media-upload/shared-types";

export const createLocalId = (): string => {
  const randomUUID = globalThis.crypto?.randomUUID;

  if (randomUUID) {
    return randomUUID.call(globalThis.crypto);
  }

  return `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

export const delay = (ms: number, signal: AbortSignal): Promise<void> => {
  throwIfAborted(signal);

  if (ms === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(createAbortError());
      },
      { once: true }
    );
  });
};

export const isAbortError = (error: unknown): boolean => hasErrorName(error, "AbortError");

export const createAbortError = (): Error => {
  const error = new Error("Upload aborted");
  error.name = "AbortError";
  return error;
};

export const throwIfAborted = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw createAbortError();
  }
};

export const progressFromUploadedChunks = (
  fileSize: number,
  chunkSize: number,
  uploadedChunkIndexes: number[]
) => {
  const uploadedBytes = uploadedChunkIndexes.reduce((total, chunkIndex) => {
    const chunkStart = chunkIndex * chunkSize;
    const chunkBytes = Math.max(0, Math.min(chunkSize, fileSize - chunkStart));
    return total + chunkBytes;
  }, 0);

  return {
    uploadedBytes,
    totalBytes: fileSize,
    percentage: fileSize === 0 ? 0 : Math.round((uploadedBytes / fileSize) * 100)
  };
};

export const completeFileMetadata = (file: UploadFileMetadata, uri: string, checksum: string): UploadFileMetadata => ({
  name: file.name,
  size: file.size,
  type: file.type,
  previewUri: file.previewUri,
  uri,
  checksum
});

export const getErrorCode = (error: unknown): UploadErrorCode => {
  if (hasUploadError(error)) {
    return error.error.code;
  }

  return UploadErrorCode.NetworkError;
};

export const getErrorMessage = (error: unknown): string => {
  if (hasUploadError(error)) {
    return error.error.message;
  }

  return error instanceof Error ? error.message : "Upload failed.";
};

export const getErrorRetryable = (error: unknown): boolean => {
  if (hasUploadError(error)) {
    return error.error.retryable;
  }

  return true;
};

export const hasUploadError = (error: unknown): error is { error: NonNullable<UploadTaskSnapshot["error"]> } =>
  typeof error === "object" && error !== null && "error" in error;

export const withoutUndefined = <T extends Record<string, unknown>>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;

const hasErrorName = (error: unknown, name: string): boolean =>
  typeof error === "object" && error !== null && "name" in error && error.name === name;
