# Frontend Upload Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished shadcn-style upload console in `apps/web` using a real chunked upload engine in `packages/upload-client`.

**Architecture:** Keep backend communication and orchestration in `packages/upload-client`. Keep browser-specific file selection, previews, and rendering in `apps/web`. React subscribes to upload snapshots and delegates upload actions to the manager.

**Tech Stack:** React 18, Vite, TypeScript, shadcn/ui, browser Fetch API, Vitest for upload-client behavior tests.

---

## File Structure

- Create `packages/upload-client/src/ApiClient.ts` for backend request/response handling.
- Create `packages/upload-client/src/errors.ts` for API and transport error mapping.
- Create `packages/upload-client/src/taskStore.ts` for immutable task snapshot updates and subscribers.
- Modify `packages/upload-client/src/UploadManager.ts` to orchestrate real uploads.
- Modify `packages/upload-client/src/index.ts` to export the public API.
- Add upload-client tests under `packages/upload-client/src/*.test.ts`.
- Initialize shadcn in `apps/web` and add UI components under `apps/web/src/components/ui`.
- Create feature components under `apps/web/src/components/upload`.
- Replace `apps/web/src/UploadApp.tsx` with the upload console.
- Replace `apps/web/src/styles.css` with shadcn-compatible global styles and app layout polish.

## Tasks

### Task 1: Test Harness

- [ ] Add Vitest to the workspace and make `packages/upload-client` run real unit tests.
- [ ] Add a failing test for API client initiate/upload/finalize calls.
- [ ] Implement `ApiClient`.
- [ ] Run the test and typecheck.

### Task 2: Upload Manager Core

- [ ] Add failing tests for snapshot subscription, progress updates, concurrency limit, retries, and finalization.
- [ ] Implement upload orchestration using existing chunk descriptors and retry helpers.
- [ ] Verify tests pass after each behavior.

### Task 3: Pause, Resume, Cancel

- [ ] Add failing tests for pause, resume, and cancel behavior.
- [ ] Implement task-level `AbortController` handling and backend cancel calls.
- [ ] Verify tests and typecheck.

### Task 4: shadcn Web Shell

- [ ] Initialize shadcn for the Vite app in `apps/web`.
- [ ] Add the components needed for the console: button, card, progress, badge, alert, separator, tooltip, table, tabs, scroll-area, sonner.
- [ ] Build the dashboard-style console layout in `apps/web/src/UploadApp.tsx` and focused upload components.

### Task 5: Browser Upload Flow

- [ ] Wire drag/drop and file picker to real `UploadManager` tasks.
- [ ] Render previews, metadata, progress, controls, retry state, and completed URLs.
- [ ] Run backend and web locally, upload a small generated media file, and verify the served media link.

### Task 6: Final Verification

- [ ] Run upload-client tests.
- [ ] Run web typecheck.
- [ ] Run web production build.
- [ ] Verify the local app visually in browser desktop and mobile widths.
