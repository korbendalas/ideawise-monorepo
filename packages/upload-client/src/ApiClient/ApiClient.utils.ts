import { UploadErrorCode, type UploadError } from "@media-upload/shared-types";

export const readUploadError = async (response: Response): Promise<UploadError> => {
  try {
    const body = (await response.json()) as { error?: UploadError };

    if (body.error) {
      return body.error;
    }
  } catch {
    // Fall through to generic error below.
  }

  return {
    code: response.status === 429 ? UploadErrorCode.RateLimited : UploadErrorCode.ServerValidationFailed,
    message: `Upload request failed with HTTP ${response.status}.`,
    retryable: response.status >= 500 || response.status === 429
  };
};

export const isAbortError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
