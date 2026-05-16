# AGENTS.md

## Project Context

This repository is a full-stack offline assignment for a job/client interview:

**Media File Upload System** - a cross-platform media upload solution with:

- Web frontend: React/Vite
- Mobile frontend: React Native/Expo
- Backend API: PHP/Symfony 6
- Shared TypeScript packages for upload contracts and upload behavior
- Monorepo managed with npm workspaces

The project must look and feel client-ready. Treat quality, clarity, tests, and documentation as part of the deliverable, not as optional polish.

## Business Goal

Build a reviewable MVP that demonstrates full-stack engineering ability:

- Robust file picking and validation
- Chunked upload with progress and controls
- Shared client logic across web and mobile
- Functional server-side APIs
- Critical unit/integration tests
- Clear setup, architecture, API, and testing documentation

This is not a toy demo. The implementation should be easy for reviewers to run, inspect, and trust.

## Repository Layout

```text
apps/
  api/       Symfony 6 backend API
  web/       React/Vite web frontend
  mobile/    Expo/React Native mobile frontend
packages/
  shared-types/   shared constants, DTOs, and upload types
  upload-client/  shared upload validation, API client, chunking, retry, and upload manager
docs/
  architecture.md
  api.md
  setup.md
  testing.md
  tradeoffs.md
  roadmap.md
```

## Current Implementation Status

### Backend

The Symfony backend is substantially implemented.

It includes:

- REST endpoints for upload initiation, chunk transfer, status query, finalization, and cancel.
- Fixed 1 MB chunk handling.
- Server-side metadata validation.
- Secondary file type validation using magic-number/content checks.
- Chunk reassembly.
- MD5 checksum deduplication.
- Organized local filesystem storage by date/checksum.
- Temporary incomplete upload cleanup after 30 minutes.
- Expired media cleanup after 30 days.
- Rate-limiting support around upload mutation endpoints.
- Consistent JSON error responses.
- Swagger/OpenAPI docs.
- PHPUnit tests for critical backend services and API behavior.

Key backend locations:

- `apps/api/src/Controller/*Upload*Controller.php`
- `apps/api/src/Service/Upload/*`
- `apps/api/src/Service/Validation/*`
- `apps/api/src/Service/Storage/*`
- `apps/api/src/Entity/*`
- `apps/api/tests/*`

### Web Frontend

The React web app is implemented as a polished upload console.

It includes:

- Drag-and-drop upload.
- File picker for images/videos.
- Multi-file validation.
- File previews and metadata.
- Upload queue.
- Individual and overall progress.
- Pause, resume, cancel controls.
- Completed upload history in `localStorage`.
- Shared `packages/upload-client` integration.

Key web locations:

- `apps/web/src/UploadApp.tsx`
- `apps/web/src/uploadHistory.ts`
- `apps/web/src/components/ui/*`

### Shared TypeScript Packages

Shared packages are central to the architecture. Prefer extending them over duplicating logic in app-specific code.

`packages/shared-types` includes:

- `CHUNK_SIZE_BYTES`
- `MAX_CONCURRENT_TRANSFERS`
- `MAX_RETRIES_PER_CHUNK`
- `MAX_FILES_PER_BATCH`
- Upload status/error/DTO types

`packages/upload-client` includes:

- File validation.
- Chunk descriptor creation.
- REST API client.
- Retry/exponential backoff logic.
- `UploadManager` with chunk upload, max 3 transfers, pause/resume/cancel, and progress snapshots.
- Unit tests.

### Mobile Frontend

The mobile app exists but is the next major focus.

Current state:

- Expo app scaffold exists in `apps/mobile`.
- Uses `expo-image-picker`.
- Can select media from library.
- Can capture media from camera.
- Requests basic permissions.
- Converts picker assets into `UploadSource`.
- Uses shared `UploadManager`.
- Has a simple preview/status UI.
- Has unit tests for upload asset normalization.

Current gap:

The mobile app is still proof-of-concept quality. It must become polished and demo-ready.

The active implementation plan is:

```text
docs/superpowers/plans/2026-05-15-react-native-upload-app.md
```

Follow that plan when implementing React Native work.

## Assignment Requirements

### Core Requirements

The MVP must include:

- Web-based frontend.
- Mobile app frontend.
- Functional server-side APIs.
- Unit tests for critical logic/components.
- Basic technical documentation: setup, architecture, API, testing, tradeoffs.

### Common Client Requirements: Web and Mobile

1. File Picker
   - Support multiple selections, 1-10 files.
   - File type filtering: `image/*`, `video/*`.
   - Instant validation for type, size, and quantity.
   - Visual file preview with thumbnail and basic metadata.

2. Upload Manager
   - Chunked upload with fixed 1 MB chunks.
   - Concurrency control with max 3 parallel uploads/transfers.
   - Visual upload progress, overall and individual file progress.
   - Pause, resume, and cancel operations.
   - Automatic retry with exponential backoff, max 3 retries.

3. User Feedback
   - Real-time upload status notifications.
   - Categorized error messages: file too large, invalid type, network issues, rate limits, server validation.
   - Upload completion notification.

### Web-Specific Requirements

- Drag-and-drop upload support.
- Responsive desktop/tablet layout.
- Local storage for upload history.

### Mobile-Specific Requirements

- Native file picker integration.
- Direct camera upload.
- Background upload support.
- Permission management for camera/gallery/storage.

For Expo MVP background behavior, use honest best-effort behavior:

- Persist completed history and incomplete upload metadata locally.
- Resume/recover when the app returns active if possible.
- Document that true OS-level background transfer requires native background upload modules or a custom dev client.

### Server Requirements

1. File Handling
   - Chunk reception and reassembly.
   - Secondary file type validation using magic-number detection.
   - Automatic cleanup of incomplete chunks after 30 minutes.

2. Storage Management
   - Organized directory storage by date/user or date/checksum for MVP.
   - File deduplication using MD5 checksum.
   - Automatic cleanup retaining files for 30 days.

3. API Specifications
   - RESTful API design.
   - Initiate upload endpoint.
   - Chunk transfer endpoint supporting parallel uploads.
   - Finalize upload endpoint that triggers reassembly.
   - Upload status query endpoint.
   - Cancel upload endpoint.

### Optional Advanced Requirements

Prioritize core requirements first. Advanced requirements can be documented as future work unless already implemented.

- Persist client upload state and auto-resume incomplete uploads.
- Track chunk status server-side with Redis.
- Cache uploaded chunks for 24 hours.
- Request audit logs with IP/user agent/operation type.
- Log levels and daily rotation.
- Upload success rate dashboard.
- Active uploads dashboard.
- System load monitoring.
- E2E tests.
- Stress test plan for at least 100 concurrent uploads.
- Network failure testing.
- Malicious file detection via sandbox.

## API Contract

Base URL:

```text
/api
```

Core endpoints:

```text
POST   /api/uploads/initiate
PUT    /api/uploads/{uploadId}/chunks/{chunkIndex}
GET    /api/uploads/{uploadId}/status
POST   /api/uploads/{uploadId}/finalize
DELETE /api/uploads/{uploadId}
```

Error shape:

```json
{
  "error": {
    "code": "invalid_type",
    "message": "Only image and video uploads are allowed.",
    "retryable": false
  }
}
```

API docs:

```text
http://localhost:8000/api-docs.html
http://localhost:8000/api/doc.json
```

## Development Commands

From the repository root:

```bash
npm install
npm run dev:backend
npm run dev:backend:detached
npm run logs:backend
npm run stop:backend
npm run dev:web
npm run dev:mobile
npm test
npm run test:client
npm run test:backend
npm run typecheck
npm run lint
```

Backend maintenance:

```bash
./scripts/docker-compose.sh run --rm api php bin/console doctrine:migrations:migrate --no-interaction
./scripts/docker-compose.sh run --rm api php bin/console app:uploads:cleanup-incomplete
./scripts/docker-compose.sh run --rm api php bin/console app:media:cleanup-expired
```

Mobile API URL examples:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api npm run dev:mobile
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api npm run dev:mobile
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000/api npm run dev:mobile
```

Use `localhost` for iOS simulator, `10.0.2.2` for Android emulator, and the machine LAN IP for physical devices.

## Engineering Rules For AI Agents

- Read this file first before making changes.
- Then inspect relevant code and docs before editing.
- Preserve the monorepo architecture.
- Do not duplicate upload protocol logic in web or mobile apps.
- Prefer `packages/upload-client` for validation, chunking, retry, concurrency, API calls, and upload state.
- Prefer `packages/shared-types` for constants and DTOs.
- Keep controllers thin in Symfony; put business logic in services.
- Keep app UI code focused and componentized.
- Avoid broad rewrites unless explicitly requested.
- Do not revert unrelated changes in the worktree.
- Use `rg` for searching.
- Use `apply_patch` for manual file edits.
- Add or update tests when behavior changes.
- Run the narrowest relevant tests first, then broader verification.
- Update docs when setup, architecture, behavior, or tradeoffs change.
- Be honest in documentation about limitations, especially mobile background upload.

## React Native Implementation Priority

The next major work item is to complete `apps/mobile`.

Follow:

```text
docs/superpowers/plans/2026-05-15-react-native-upload-app.md
```

Priority order:

1. Add mobile config and required dependencies.
2. Build AsyncStorage-backed completed history.
3. Add a mobile upload manager hook around shared `UploadManager`.
4. Improve picker/camera asset normalization.
5. Build polished upload UI components.
6. Replace `UploadScreen.tsx` with a full queue-based mobile experience.
7. Add persisted draft/app-resume behavior.
8. Add mobile tests for permissions, picker/camera, rendering, and controls.
9. Update README/setup/architecture/testing docs.
10. Run final verification.

Target mobile UX:

- Native-feeling screen, not a scaffold.
- Clear header and queue summary.
- `Choose media` and `Use camera` entry points.
- Permission and validation banners.
- Active and completed upload sections.
- Each file card shows preview, name, size, MIME type, status, progress, and controls.
- Pause, resume, and cancel are easy to find.
- Completed history remains after restart.

## Testing Expectations

Required before final submission:

```bash
npm test
npm run typecheck
npm run test:backend
```

Useful focused commands:

```bash
npm --workspace @media-upload/upload-client test
npm --workspace @media-upload/mobile test
npm --workspace @media-upload/mobile run typecheck
npm --workspace @media-upload/web test
npm --workspace @media-upload/web run typecheck
```

Manual demo checklist:

- Start backend.
- Open Swagger docs.
- Run web app and upload image/video files.
- Verify web drag/drop, preview, progress, pause/resume/cancel, completion history.
- Run mobile app with correct `EXPO_PUBLIC_API_BASE_URL`.
- Deny and allow permissions to verify permission UX.
- Select multiple media files.
- Capture media from camera.
- Verify mobile preview, metadata, progress, pause/resume/cancel, and completed history.

## Documentation Expectations

Keep these docs aligned with the actual implementation:

- `README.md`
- `docs/setup.md`
- `docs/architecture.md`
- `docs/api.md`
- `docs/testing.md`
- `docs/tradeoffs.md`

If a feature is partial, document it as partial. Do not overclaim.

## Quality Bar

This project is presented to a client/interviewer. Optimize for:

- Correctness.
- Reviewability.
- Clear boundaries.
- Reliable local setup.
- Strong visual/mobile UX.
- Tests for important behavior.
- Honest tradeoffs.
- No fragile or theatrical code.

