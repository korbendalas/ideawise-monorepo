# Media File Upload System

Cross-platform media upload assignment using React, Expo, Symfony 6, and a shared TypeScript upload client.

The implementation is intentionally scoped for a 4-day interview assignment: reliable chunked upload first, production hooks second.

## Stack

- Web: React
- Mobile: React Native / Expo
- API: Symfony 6
- Monorepo: pnpm workspaces
- Shared client logic: TypeScript package under `packages/upload-client`

## Core Capabilities

- Image/video file selection
- 1-10 file validation
- Fixed 1MB chunked upload
- Max 3 concurrent chunk transfers
- Pause, resume, cancel
- Retry with exponential backoff, max 3 retries
- Upload progress and previews
- Server-side chunk reception, reassembly, magic number validation, deduplication, and cleanup

## Repository Layout

```text
apps/
  web/       React web frontend
  mobile/    Expo mobile frontend
  api/       Symfony 6 backend
packages/
  upload-client/ shared upload state machine and API client contracts
  shared-types/  shared API DTOs and enums
docs/
  architecture.md
  api.md
  roadmap.md
  setup.md
  testing.md
```

## Start Here

Read these first:

- [Architecture](docs/architecture.md)
- [API Contract](docs/api.md)
- [4-Day Roadmap](docs/roadmap.md)
- [Setup](docs/setup.md)
- [Testing Strategy](docs/testing.md)

## Why Monorepo

The web and mobile apps share the same upload behavior: chunking, concurrency, retry, pause/resume, validation, and API contracts. Keeping that logic in one package reduces duplication and makes the project easier to review.
