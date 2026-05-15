<?php

namespace App\Service\Validation;

use App\Exception\UploadException;

final class UploadMetadataValidator
{
    public function __construct(private readonly int $chunkSize)
    {
    }

    /** @param array<string, mixed> $payload */
    public function validate(array $payload): void
    {
        $required = ['fileName', 'fileSize', 'mimeType', 'totalChunks', 'chunkSize'];
        foreach ($required as $field) {
            if (!array_key_exists($field, $payload)) {
                throw new UploadException('invalid_request', sprintf('Missing field: %s.', $field));
            }
        }

        if (!is_string($payload['fileName']) || trim($payload['fileName']) === '') {
            throw new UploadException('invalid_request', 'File name is required.');
        }

        if (!$this->isAllowedMime((string) $payload['mimeType'])) {
            throw new UploadException('invalid_type', 'Only image and video uploads are allowed.');
        }

        if ((int) $payload['fileSize'] <= 0) {
            throw new UploadException('file_too_large', 'File must not be empty.');
        }

        if ((int) $payload['chunkSize'] !== $this->chunkSize) {
            throw new UploadException('invalid_chunk_size', 'Chunk size must be exactly 1MB.');
        }

        $expectedTotal = (int) ceil(((int) $payload['fileSize']) / $this->chunkSize);
        if ((int) $payload['totalChunks'] !== $expectedTotal) {
            throw new UploadException('invalid_chunk_count', 'Total chunks does not match file size.');
        }
    }

    public function isAllowedMime(string $mimeType): bool
    {
        return str_starts_with($mimeType, 'image/') || str_starts_with($mimeType, 'video/');
    }
}
