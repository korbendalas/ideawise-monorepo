# API Contract

Base URL:

```text
/api
```

## Initiate Upload

```http
POST /api/uploads/initiate
Content-Type: application/json
```

Request:

```json
{
  "fileName": "video.mp4",
  "fileSize": 52428800,
  "mimeType": "video/mp4",
  "checksum": "optional-client-checksum",
  "totalChunks": 50,
  "chunkSize": 1048576
}
```

Response:

```json
{
  "uploadId": "upl_123",
  "status": "initialized",
  "alreadyUploaded": false,
  "uploadedChunkIndexes": [],
  "maxConcurrentChunks": 3,
  "chunkSize": 1048576
}
```

Deduplication response:

```json
{
  "uploadId": null,
  "status": "completed",
  "alreadyUploaded": true,
  "uploadedChunkIndexes": [],
  "maxConcurrentChunks": 3,
  "chunkSize": 1048576,
  "file": {
    "id": "file_456",
    "fileName": "video.mp4",
    "mimeType": "video/mp4",
    "size": 52428800,
    "checksum": "abc123",
    "url": "/media/2026/05/15/video.mp4"
  }
}
```

## Upload Chunk

```http
PUT /api/uploads/{uploadId}/chunks/{chunkIndex}
Content-Type: application/octet-stream
```

Body:

```text
Raw binary chunk bytes. Send at most 1 MB per chunk; only the final chunk may be smaller.
```

Response:

```json
{
  "uploadId": "upl_123",
  "chunkIndex": 4,
  "status": "received"
}
```

## Upload Status

```http
GET /api/uploads/{uploadId}/status
```

Response:

```json
{
  "uploadId": "upl_123",
  "status": "uploading",
  "fileName": "video.mp4",
  "totalChunks": 50,
  "receivedChunks": 31,
  "uploadedChunkIndexes": [0, 1, 2, 3],
  "expiresAt": "2026-05-15T12:30:00Z"
}
```

## Finalize Upload

```http
POST /api/uploads/{uploadId}/finalize
```

Response:

```json
{
  "uploadId": "upl_123",
  "status": "completed",
  "file": {
    "id": "file_456",
    "fileName": "video.mp4",
    "mimeType": "video/mp4",
    "size": 52428800,
    "checksum": "abc123",
    "url": "/media/2026/05/15/video.mp4"
  }
}
```

## Cancel Upload

```http
DELETE /api/uploads/{uploadId}
```

Response:

```json
{
  "uploadId": "upl_123",
  "status": "cancelled"
}
```

## Error Shape

```json
{
  "error": {
    "code": "invalid_type",
    "message": "Only image and video uploads are allowed.",
    "retryable": false
  }
}
```

## Expected Error Codes

```text
invalid_type
invalid_file_size
file_too_large
too_many_files
upload_not_found
chunk_already_received
chunk_too_large
missing_chunks
rate_limited
server_validation_failed
```
