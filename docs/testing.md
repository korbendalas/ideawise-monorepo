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

Use Jest with mocked Expo modules.

Test:

- Permission accepted/denied states.
- Picker result normalization.
- Camera result normalization.
- Upload task rendering.

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
