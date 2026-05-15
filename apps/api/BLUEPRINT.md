# Symfony Backend Blueprint

Create the Symfony app here during implementation. Keep the backend organized around upload use cases rather than thin controllers with all logic inline.

## Target Source Layout

```text
src/
  Controller/
    InitiateUploadController.php
    UploadChunkController.php
    UploadStatusController.php
    FinalizeUploadController.php
    CancelUploadController.php
  Entity/
    UploadSession.php
    UploadChunk.php
    MediaFile.php
  Repository/
    UploadSessionRepository.php
    MediaFileRepository.php
  Service/
    Upload/
      UploadInitiationService.php
      ChunkStorageService.php
      UploadFinalizationService.php
      UploadCleanupService.php
    Storage/
      LocalMediaStorage.php
    Validation/
      FileTypeValidator.php
      UploadMetadataValidator.php
  Command/
    CleanupIncompleteUploadsCommand.php
    CleanupExpiredMediaCommand.php
```

## Key Rules

- Controllers should parse input and delegate to services.
- Services should return structured DTOs or throw domain exceptions.
- Chunk paths must be generated server-side, never from client filenames.
- Finalization must verify every expected chunk exists before reassembly.
- Magic number validation is authoritative; client MIME type is only advisory.
- Deduplication should happen by final checksum.
