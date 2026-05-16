# Media File Upload System

Production-grade media upload assignment built as a monorepo with a Symfony 6 backend, polished React web app, Expo mobile app, and shared TypeScript upload packages.

The backend, web app, shared upload client, and Expo mobile upload flow are implemented as the current MVP. The system provides a resumable-style chunked upload API with 1 MB chunks, server-side validation, reassembly, deduplication, cleanup commands, tests, generated OpenAPI documentation, web drag-and-drop, and mobile picker/camera upload UX.

## Assignment Coverage

- Web frontend: React/Vite upload console with drag-and-drop, previews, progress, controls, and local history.
- Mobile frontend: Expo app with media library picker, camera capture, permissions, previews, upload queue, controls, and persisted mobile history/draft metadata.
- Server APIs: Symfony 6 chunked upload API with validation, reassembly, deduplication, cleanup, rate limiting, and Swagger docs.
- Tests: PHPUnit backend tests, shared upload-client unit tests, web history tests, and mobile upload helper/storage/presentation tests.

## Purpose

This project demonstrates how to build the core of a real media upload platform:

- reliable fixed-size chunk reception
- max 3 concurrent chunk transfers from clients
- pause, resume, and cancel friendly upload sessions
- retry friendly JSON errors
- backend reassembly and magic-number validation
- checksum-based deduplication
- temporary and expired media cleanup
- clear API documentation for reviewers and client teams

The implementation is intentionally reviewable for an interview/offline assignment, but the architecture uses production-minded boundaries: controllers stay thin, upload logic lives in services, storage is abstracted behind a local storage service, validation is centralized, and cleanup is handled by console commands.

## Tech Stack

- Backend: Symfony 6.4, Doctrine ORM, SQLite, PHPUnit
- API Docs: NelmioApiDocBundle, OpenAPI 3, Swagger UI
- Runtime: Docker Desktop / Docker Compose
- Web: React/Vite
- Mobile: Expo/React Native
- Shared packages: TypeScript upload client and shared DTO/constants
- Monorepo: npm workspaces

## Quick Start

This is the fastest path for reviewers. You do not need local PHP, Composer, Symfony CLI, or a local database.

### Prerequisites

Install these first:

- Node.js 20+
- npm 10+
- Docker Desktop with Docker Compose

Make sure Docker Desktop is running before starting the project.

### Run Everything

From the repository root:

```bash
npm install
npm run dev:all
```

`npm run dev:all` starts the full local stack:

- Symfony API in Docker at `http://localhost:8000/api`
- React web app at `http://localhost:5173`
- Expo/Metro dev server for the mobile app

On the first backend start, Docker runs Composer install, creates storage folders, runs database migrations, and starts the Symfony API server.

### Open The Apps

```text
Web app:       http://localhost:5173
API base:      http://localhost:8000/api
Swagger UI:    http://localhost:8000/api-docs.html
OpenAPI JSON:  http://localhost:8000/api/doc.json
```

For mobile, keep the terminal running and use the Expo output:

- Press `i` for the iOS simulator.
- Press `a` for the Android emulator.
- Scan the QR code with Expo Go for a physical device.

For a physical device, set the API URL to your machine LAN IP:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000/api npm run dev:mobile
```

Use `localhost` for the iOS simulator and `10.0.2.2` for the Android emulator.

### Stop The Stack

Stop the running dev terminal with `Ctrl+C`, then stop backend containers if needed:

```bash
npm run stop:backend
```

If ports are already in use, stop older local servers or Docker containers and run `npm run dev:all` again.

## Backend Architecture

```text
Client apps
  |
  | HTTP JSON + multipart/form-data
  v
Symfony controllers
  |
  | delegate
  v
Upload services
  |
  +--> metadata validation
  +--> chunk validation
  +--> chunk storage
  +--> status calculation
  +--> final reassembly
  +--> MIME magic-number validation
  +--> checksum deduplication
  +--> cleanup
  |
  v
Doctrine entities + local filesystem storage
```

Main backend modules:

- `UploadSession` tracks an upload lifecycle.
- `UploadChunk` tracks received chunks.
- `MediaFile` tracks completed media files.
- `UploadInitiationService` creates sessions and handles checksum deduplication.
- `ChunkStorageService` receives, validates, and stores chunks.
- `UploadFinalizationService` reassembles chunks, validates MIME content, computes MD5, stores final media, and deduplicates.
- `UploadStatusService` returns received chunk indexes and session state.
- `UploadCleanupService` removes expired temporary uploads and old media.
- `LocalMediaStorage` owns the filesystem layout.
- `JsonErrorResponder` keeps API errors consistent.
- `UploadRateLimiter` protects mutation endpoints.

## Upload Flow

```text
POST /api/uploads/initiate
  -> create upload session or return existing file if checksum already exists

PUT /api/uploads/{uploadId}/chunks/{chunkIndex}
  -> receive one raw application/octet-stream chunk in the request body
  -> enforce 1 MB chunk size, except smaller final chunk

GET /api/uploads/{uploadId}/status
  -> return status and uploaded chunk indexes

POST /api/uploads/{uploadId}/finalize
  -> verify all chunks exist
  -> reassemble file
  -> calculate checksum
  -> validate real MIME type from file content
  -> store final media or return deduplicated media

DELETE /api/uploads/{uploadId}
  -> cancel upload and delete temporary chunks
```

## Commands

From the repository root:

```bash
npm run dev:all                  # one-command local stack: backend + web + mobile
npm run dev:backend              # start Symfony API through Docker Compose
npm run dev:backend:detached     # start API in the background
npm run logs:backend             # follow API logs
npm run stop:backend             # stop Docker Compose services
npm run validate:backend         # validate backend composer.json
npm run test:backend             # run backend PHPUnit suite
npm run dev:web                  # start React web app
npm run dev:mobile               # start Expo mobile app
npm test                         # run workspace tests
npm run test:client              # run shared upload-client tests
npm run lint                     # run workspace lint scripts
npm run typecheck                # run workspace type checks
```

Backend maintenance commands:

```bash
./scripts/docker-compose.sh run --rm api php bin/console doctrine:migrations:migrate --no-interaction
./scripts/docker-compose.sh run --rm api php bin/console app:uploads:cleanup-incomplete
./scripts/docker-compose.sh run --rm api php bin/console app:media:cleanup-expired
```

The `scripts/docker-compose.sh` wrapper supports `docker compose`, `docker-compose`, and the common macOS `/usr/local/bin/docker-compose` path.

## API Contract

The API returns JSON for all normal responses and errors.

Error shape:

```json
{
  "error": {
    "code": "missing_chunks",
    "message": "Upload cannot be finalized because chunks are missing.",
    "retryable": false
  }
}
```

Core endpoints:

```text
POST   /api/uploads/initiate
PUT    /api/uploads/{uploadId}/chunks/{chunkIndex}
GET    /api/uploads/{uploadId}/status
POST   /api/uploads/{uploadId}/finalize
DELETE /api/uploads/{uploadId}
```

See the generated Swagger UI for request and response schemas:

```text
http://localhost:8000/api-docs.html
```

## Storage Layout

Temporary chunks:

```text
apps/api/var/storage/tmp/{uploadId}/chunk_000001.part
```

Final media:

```text
apps/api/var/storage/media/{yyyy}/{mm}/{dd}/{checksum}.{extension}
```

SQLite database:

```text
apps/api/var/data.db
```

## Repository Layout

```text
apps/
  api/       Symfony 6 backend
  web/       React web upload console
  mobile/    Expo mobile upload app
packages/
  shared-types/   shared constants and API DTOs
  upload-client/  shared upload validation, API, chunking, retry, and manager logic
docs/
  api.md
  architecture.md
  roadmap.md
  setup.md
  testing.md
  tradeoffs.md
scripts/
  docker-compose.sh
```

## Verification

The backend currently has PHPUnit coverage for validation, local storage, file type validation, upload API behavior, and OpenAPI documentation generation.

Current verification commands:

```bash
npm run validate:backend
npm run test:backend
./scripts/docker-compose.sh run --rm api php bin/console lint:yaml config
./scripts/docker-compose.sh run --rm api php bin/console lint:container
./scripts/docker-compose.sh run --rm api php bin/console nelmio:apidoc:dump --format=json
```

## Notes For Reviewers

- The backend is Docker-first to keep local setup simple and reproducible.
- SQLite and local filesystem storage are used for assignment review speed.
- Storage is isolated behind service boundaries so S3 or MinIO can replace local storage later.
- Finalization validates the actual file content, not only the client-provided MIME type.
- Checksums support deduplication across completed uploads.
- Cleanup commands model production retention jobs.
- Swagger UI is available locally for quick endpoint inspection and manual testing.

## Further Documentation

- [Setup](docs/setup.md)
- [Architecture](docs/architecture.md)
- [API Contract](docs/api.md)
- [Testing Strategy](docs/testing.md)
- [Roadmap](docs/roadmap.md)
- [Tradeoffs](docs/tradeoffs.md)
