# Architecture Overview

## Goal

Build a cross-platform media upload system with shared upload behavior across React web and Expo mobile clients, backed by a Symfony 6 REST API.

The MVP prioritizes correctness and reviewability over infrastructure complexity.

## System Diagram

```text
React Web App ─┐
               ├── packages/upload-client ─── Symfony 6 API ─── Local filesystem storage
Expo Mobile ───┘                                  │
                                                  └── SQL database upload state
```

## Components

### Web App

Responsibilities:

- Drag-and-drop file selection
- Image/video filtering
- Quantity, type, and size validation
- Preview and metadata display
- Upload progress UI
- Pause, resume, cancel controls
- Local upload history using `localStorage`

### Mobile App

Responsibilities:

- Native file picker integration
- Camera upload entry point
- Permission states for camera/gallery/storage
- Preview and metadata display
- Upload progress UI
- Local upload state using AsyncStorage

### Shared Upload Client

Responsibilities:

- Fixed 1MB chunk calculation
- Upload task state model
- Global concurrency limit of 3 active chunk transfers
- Retry with exponential backoff, max 3 retries
- Pause/resume/cancel state transitions
- API client contracts

### Symfony API

Responsibilities:

- Upload session creation
- Chunk reception
- Status query
- Finalization and reassembly
- Magic number validation
- Deduplication by checksum
- Temporary chunk cleanup after 30 minutes
- Retention cleanup after 30 days

## Upload Lifecycle

```text
selected
  -> client validation
  -> initiate upload
  -> chunk upload queue
  -> pause/resume/cancel as needed
  -> finalize upload
  -> server reassembly
  -> server magic number validation
  -> deduplication
  -> completed media record
```

## Storage Strategy

MVP uses local filesystem storage:

```text
var/storage/tmp/{uploadId}/chunk_000001.part
var/storage/media/{yyyy}/{mm}/{dd}/{checksum}.{extension}
```

This keeps local development and review simple. A `StorageService` boundary should make S3 or MinIO a later replacement without changing controller behavior.

## Production Hooks

Designed extension points:

- Redis for chunk status and resumability cache
- Queue worker for finalization
- S3-compatible object storage
- Authenticated users and per-user directories
- Virus scanning pipeline
- WebSocket/SSE status updates
- k6 stress test suite
