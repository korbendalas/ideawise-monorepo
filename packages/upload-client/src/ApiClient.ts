import type {
  InitiateUploadRequest,
  InitiateUploadResponse,
  UploadError,
  UploadedFileDto,
  UploadStatusResponse
} from "@media-upload/shared-types";

export type ApiClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

type FinalizeUploadResponse = {
  status: "completed";
  file: UploadedFileDto;
};

export class UploadApiError extends Error {
  readonly error: UploadError;
  readonly status: number;

  constructor(error: UploadError, status: number) {
    super(error.message);
    this.name = "UploadApiError";
    this.error = error;
    this.status = status;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "/api").replace(/\/$/, "");
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  initiate(request: InitiateUploadRequest, signal?: AbortSignal): Promise<InitiateUploadResponse> {
    return this.request<InitiateUploadResponse>("/uploads/initiate", {
      method: "POST",
      body: JSON.stringify(request),
      headers: {
        "content-type": "application/json"
      },
      signal
    });
  }

  uploadChunk(uploadId: string, chunkIndex: number, chunk: Blob, signal?: AbortSignal): Promise<void> {
    return this.request<void>(`/uploads/${uploadId}/chunks/${chunkIndex}`, {
      method: "PUT",
      body: chunk,
      headers: {
        "content-type": "application/octet-stream"
      },
      signal
    });
  }

  getStatus(uploadId: string, signal?: AbortSignal): Promise<UploadStatusResponse> {
    return this.request<UploadStatusResponse>(`/uploads/${uploadId}/status`, {
      method: "GET",
      signal
    });
  }

  async finalize(uploadId: string, signal?: AbortSignal): Promise<UploadedFileDto> {
    const response = await this.request<FinalizeUploadResponse | UploadedFileDto>(`/uploads/${uploadId}/finalize`, {
      method: "POST",
      signal
    });

    return "file" in response ? response.file : response;
  }

  cancel(uploadId: string, signal?: AbortSignal): Promise<void> {
    return this.request<void>(`/uploads/${uploadId}`, {
      method: "DELETE",
      signal
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    let response: Response;

    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, init);
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      throw new UploadApiError(
        {
          code: "network_error",
          message: error instanceof Error ? error.message : "Network request failed.",
          retryable: true
        },
        0
      );
    }

    if (!response.ok) {
      throw new UploadApiError(await readUploadError(response), response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

async function readUploadError(response: Response): Promise<UploadError> {
  try {
    const body = (await response.json()) as { error?: UploadError };

    if (body.error) {
      return body.error;
    }
  } catch {
    // Fall through to generic error below.
  }

  return {
    code: response.status === 429 ? "rate_limited" : "server_validation_failed",
    message: `Upload request failed with HTTP ${response.status}.`,
    retryable: response.status >= 500 || response.status === 429
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
