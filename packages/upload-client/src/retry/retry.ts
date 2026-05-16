import { MAX_RETRIES_PER_CHUNK } from "@media-upload/shared-types";

export const getRetryDelayMs = (attempt: number): number =>
  500 * 2 ** Math.max(0, attempt - 1);

export const canRetry = (attempt: number, maxRetries = MAX_RETRIES_PER_CHUNK): boolean =>
  attempt < maxRetries;
