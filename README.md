# Media File Upload System

Production-grade media upload assignment built as a monorepo with a Symfony 6 backend, React web app scaffold, Expo mobile app scaffold, and shared TypeScript upload packages.

The backend is the currently implemented part of the system. It provides a resumable-style chunked upload API with 1 MB chunks, server-side validation, reassembly, deduplication, cleanup commands, tests, and generated OpenAPI documentation.

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
- Runtime: Docker Compose
- Web: React/Vite scaffold
- Mobile: Expo/React Native scaffold
- Shared packages: TypeScript upload client and shared DTO/constants
- Monorepo: pnpm workspaces

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
  -> receive one multipart chunk named "chunk"
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

## Local URLs

After starting the backend:

```text
API base:      http://localhost:8000/api
Swagger UI:    http://localhost:8000/api-docs.html
OpenAPI JSON:  http://localhost:8000/api/doc.json
OpenAPI YAML:  http://localhost:8000/api/doc.yaml
```

## Quick Start

Prerequisites:

- Node.js 20+
- pnpm 9+
- Docker Desktop with Docker Compose

Local PHP, Composer, and Symfony CLI are not required.

Install JavaScript dependencies:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install
```

Start the backend API:

```bash
pnpm dev:api
```

Start the backend in the background:

```bash
pnpm dev:api:detached
```

Follow backend logs:

```bash
pnpm logs:api
```

Stop the backend:

```bash
pnpm stop:api
```

## Commands

From the repository root:

```bash
pnpm dev:api              # start Symfony API through Docker Compose
pnpm dev:api:detached     # start API in the background
pnpm logs:api             # follow API logs
pnpm stop:api             # stop Docker Compose services
pnpm validate:api         # validate backend composer.json
pnpm test:api             # run backend PHPUnit suite
pnpm dev:web              # start React web app scaffold
pnpm dev:mobile           # start Expo mobile app scaffold
pnpm test                 # run workspace tests
pnpm test:client          # run shared upload-client tests
pnpm lint                 # run workspace lint scripts
pnpm typecheck            # run workspace type checks
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
  web/       React web frontend scaffold
  mobile/    Expo mobile frontend scaffold
packages/
  shared-types/   shared constants and API DTOs
  upload-client/  shared upload client package scaffold
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
pnpm validate:api
pnpm test:api
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
