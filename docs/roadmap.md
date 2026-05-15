# 4-Day Implementation Roadmap

## Day 1 - Foundation and Contract

- Create Symfony 6 API app under `apps/api`.
- Add upload entities and migrations.
- Implement upload initiation endpoint.
- Implement chunk upload endpoint.
- Implement upload status endpoint.
- Store chunks on local filesystem.
- Keep the shared TypeScript upload contract aligned with backend DTOs.

Deliverable: clients can initiate an upload and send chunks to the backend.

## Day 2 - Upload Manager and Finalization

- Implement upload queue in `packages/upload-client`.
- Enforce max 3 concurrent chunk transfers.
- Add retry with exponential backoff.
- Add pause, resume, and cancel behavior.
- Implement backend finalization.
- Reassemble chunks.
- Calculate final checksum.
- Validate magic number.
- Deduplicate by checksum.

Deliverable: one file can be uploaded, finalized, validated, deduplicated, and stored.

## Day 3 - Web and Mobile UX

- Build web drag-and-drop upload screen.
- Add web previews, metadata, progress, and controls.
- Persist web upload history in `localStorage`.
- Integrate Expo picker and camera entry points.
- Add mobile permission handling.
- Reuse shared upload-client logic from both clients.

Deliverable: web and mobile apps both use the same upload pipeline.

## Day 4 - Hardening and Submission Polish

- Add cleanup command for incomplete uploads older than 30 minutes.
- Add retention cleanup for files older than 30 days.
- Add rate limiting around upload endpoints.
- Add request logging.
- Add backend integration tests.
- Add upload-client unit tests.
- Complete setup, architecture, API, and testing docs.

Deliverable: polished GitHub repository ready for review.

## Non-Goals for MVP

- Full authentication system
- S3 or cloud storage
- Real-time monitoring dashboard
- Malware sandbox integration
- Video transcoding
- CDN integration
- Full background upload guarantees on mobile
