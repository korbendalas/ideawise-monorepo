# Testing Strategy

## Shared Upload Client

Unit tests should cover:

- 10.5MB file creates 11 chunks.
- Invalid MIME type is rejected.
- More than 10 files is rejected.
- Retry delay follows 500ms, 1000ms, 2000ms.
- No more than 3 chunk transfers run at once.
- Pause stops scheduling new chunks.
- Resume continues missing chunks.
- Cancel marks the task cancelled and aborts possible in-flight requests.

## Web

Use React Testing Library.

Test:

- File picker validation messages.
- Queued upload task rendering.
- Progress display.
- Pause/resume/cancel button state.
- Upload history persistence in `localStorage`.

## Mobile

The current MVP uses Node's test runner with `tsx` for pure mobile logic and presentation helpers.

Test:

- Picker result normalization.
- Completed history serialization and merging.
- Resumable draft serialization and merging.
- Upload summary aggregation.
- Presentation helpers for status, actions, and byte formatting.

Run:

```bash
npm --workspace @media-upload/mobile test
npm --workspace @media-upload/mobile run typecheck
```

Component-level React Native tests with mocked Expo modules are planned hardening once the Expo UI stabilizes.

## Backend

Use PHPUnit.

Test:

- Upload initiation validation.
- Chunk storage path generation.
- Duplicate chunk handling.
- Finalization fails if chunks are missing.
- Finalization reassembles chunks in order.
- Magic number validation rejects spoofed MIME types.
- Deduplication returns existing media record.
- Cleanup removes expired temporary chunks.

## E2E and Stress Plan

For the 4-day MVP, document these as planned hardening:

- Playwright happy-path web upload.
- k6 script for 100 concurrent uploads.
- Network failure tests using request aborts and throttling.
- Mobile E2E with Detox after Expo flow stabilizes.

## Manual Mobile Demo Checklist

- Start backend with `npm run dev:backend:detached`.
- Start Expo with the correct `EXPO_PUBLIC_API_BASE_URL` for the simulator or device.
- Deny media permission and confirm the app shows a clear permission message.
- Allow media permission and select 2-3 image/video files.
- Confirm validation rejects invalid type, too many files, or oversized files.
- Confirm each queued file shows preview, metadata, progress, and final completion.
- Pause and resume one active upload.
- Cancel one active upload.
- Capture media from camera and upload it.
- Restart the app and confirm completed history remains available.
