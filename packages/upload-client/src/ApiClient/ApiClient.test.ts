import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { ApiClient } from "./ApiClient";

describe("ApiClient", () => {
  it("calls the backend upload lifecycle endpoints", async () => {
    const fetcher = mock.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const path = String(url);

      if (path.endsWith("/api/uploads/initiate")) {
        return jsonResponse({
          uploadId: "0123456789abcdef0123456789abcdef",
          status: "initialized",
          alreadyUploaded: false,
          uploadedChunkIndexes: [],
          maxConcurrentChunks: 3,
          chunkSize: 1024 * 1024
        });
      }

      if (path.includes("/chunks/0") && init?.method === "PUT") {
        return jsonResponse({ ok: true });
      }

      if (path.endsWith("/finalize")) {
        return jsonResponse({
          status: "completed",
          file: {
            id: "media-1",
            fileName: "clip.jpg",
            mimeType: "image/jpeg",
            size: 12,
            checksum: "abc123",
            url: "/media/2026/05/15/abc123.jpg"
          }
        });
      }

      throw new Error(`Unexpected request: ${init?.method} ${path}`);
    });

    const client = new ApiClient({ baseUrl: "http://localhost:8000/api", fetcher });
    const initiated = await client.initiate({
      fileName: "clip.jpg",
      fileSize: 12,
      mimeType: "image/jpeg",
      totalChunks: 1,
      chunkSize: 1024 * 1024
    });
    await client.uploadChunk(initiated.uploadId ?? "", 0, new Blob(["hello"]));
    const finalized = await client.finalize(initiated.uploadId ?? "");

    assert.equal(fetcher.mock.calls[0].arguments[0], "http://localhost:8000/api/uploads/initiate");
    assert.equal(fetcher.mock.calls[0].arguments[1]?.method, "POST");
    assert.equal(
      fetcher.mock.calls[1].arguments[0],
      "http://localhost:8000/api/uploads/0123456789abcdef0123456789abcdef/chunks/0"
    );
    assert.equal(fetcher.mock.calls[1].arguments[1]?.method, "PUT");
    assert.ok(fetcher.mock.calls[1].arguments[1]?.body instanceof Blob);
    assert.equal(finalized.url, "/media/2026/05/15/abc123.jpg");
  });

  it("throws structured errors from non-2xx responses", async () => {
    const client = new ApiClient({
      baseUrl: "http://localhost:8000/api",
      fetcher: async () =>
        jsonResponse(
          {
            error: {
              code: "rate_limited",
              message: "Too many upload requests.",
              retryable: true
            }
          },
          429
        )
    });

    await assert.rejects(
      client.initiate({
        fileName: "clip.jpg",
        fileSize: 12,
        mimeType: "image/jpeg",
        totalChunks: 1,
        chunkSize: 1024 * 1024
      }),
      (error: unknown) =>
        typeof error === "object" &&
        error !== null &&
        "error" in error &&
        (error as { error: { code: string; retryable: boolean } }).error.code === "rate_limited" &&
        (error as { error: { code: string; retryable: boolean } }).error.retryable
    );
  });

  it("keeps the default browser fetch bound to the global object", async () => {
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = async function (this: typeof globalThis, url: string | URL | Request) {
        assert.equal(this, globalThis);
        assert.equal(String(url), "http://localhost:8000/api/uploads/initiate");

        return jsonResponse({
          uploadId: "0123456789abcdef0123456789abcdef",
          status: "initialized",
          alreadyUploaded: false,
          uploadedChunkIndexes: [],
          maxConcurrentChunks: 3,
          chunkSize: 1024 * 1024
        });
      } as typeof fetch;

      const client = new ApiClient({ baseUrl: "http://localhost:8000/api" });
      const initiated = await client.initiate({
        fileName: "clip.jpg",
        fileSize: 12,
        mimeType: "image/jpeg",
        totalChunks: 1,
        chunkSize: 1024 * 1024
      });

      assert.equal(initiated.status, "initialized");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
