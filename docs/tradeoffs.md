# Tradeoffs and Non-Goals

## Chosen Tradeoffs

### npm Workspaces

Chosen because it is built into Node.js tooling, easy for reviewers to run, and works cleanly with `apps/*` and `packages/*` without an extra package manager setup step.

### Filesystem Storage

Chosen for local review simplicity. The backend should still hide storage details behind a service so S3 or MinIO can be added later.

### Database Chunk State

Chosen for MVP simplicity. Redis is a good future optimization for resumable upload state and 24-hour chunk retention.

### Shared Upload Client

Chosen to avoid duplicated chunking, retry, concurrency, and pause/resume logic between web and mobile.

### Magic Number Validation at Finalization

Chosen because validating the full reassembled file is simpler and more reliable than trying to validate isolated chunks.

### Expo Background Upload Boundary

The mobile MVP persists completed history and incomplete draft metadata with AsyncStorage and reports resumable state when the app returns active. Full OS-level background transfer is not guaranteed in a managed Expo flow without adding native background upload infrastructure.

## Non-Goals

- Authentication and authorization
- Multi-user ownership model
- Cloud storage
- Real-time dashboard
- Malware sandbox integration
- Video transcoding
- Image optimization
- CDN delivery
- Full mobile background upload guarantees
