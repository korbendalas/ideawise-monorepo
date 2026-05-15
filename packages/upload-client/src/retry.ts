import { MAX_RETRIES_PER_CHUNK } from "@media-upload/shared-types";

export function getRetryDelayMs(attempt: number): number {
  return 500 * 2 ** Math.max(0, attempt - 1);
}

export function canRetry(attempt: number, maxRetries = MAX_RETRIES_PER_CHUNK): boolean {
  return attempt < maxRetries;
}
