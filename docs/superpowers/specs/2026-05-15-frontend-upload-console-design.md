# Frontend Upload Console Design

## Goal

Build the production-quality React frontend for the media upload assignment inside `apps/web`, backed by a reusable upload engine in `packages/upload-client`.

## Product Shape

The web app is a single-screen operational upload console, not a landing page. It should look like a polished shadcn-style dashboard for reviewers: compact, status-oriented, and easy to use repeatedly.

The first screen includes:

- Drag/drop and file picker for image and video files.
- Validation feedback for file type, file count, empty files, and max size.
- Summary counters for queued, uploading, completed, failed, and total bytes.
- A task queue with thumbnail previews, metadata, progress, status badges, and controls.
- Pause, resume, retry, and cancel actions.
- Completed media links returned by the backend.

## Upload Engine

`packages/upload-client` owns backend communication and upload orchestration. It must expose a platform-flexible API so the web app can use browser `File` objects now while the mobile app can adapt later.

The engine should:

- Initiate uploads through `POST /api/uploads/initiate`.
- Slice files into fixed 1 MB chunks.
- Upload chunks through `PUT /api/uploads/{uploadId}/chunks/{chunkIndex}`.
- Run up to 3 concurrent chunk transfers per file.
- Retry failed chunks up to 3 times with exponential backoff.
- Pause/resume/cancel using `AbortController`.
- Finalize through `POST /api/uploads/{uploadId}/finalize`.
- Emit immutable task snapshots for React to render.
- Preserve backend error codes and map unknown failures to retryable network errors where appropriate.

## Web App

`apps/web` consumes the upload engine and renders the workflow. The app should use shadcn components and local composition under `apps/web/src`.

The UI should avoid marketing layout, oversized hero treatment, decorative fluff, and fake-only progress. Controls should operate on real upload state. If the backend is unavailable, errors should be visible and retryable where possible.

## Verification

Implementation must include upload-client tests for chunk queueing, retries, pause/cancel, and API error handling. Final verification should include TypeScript checks, production build, and a browser run against the local backend when feasible.
