<?php

namespace App\Service\Validation;

use App\Entity\UploadSession;
use App\Exception\UploadException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class ChunkValidator
{
    public function __construct(private readonly int $chunkSize)
    {
    }

    public function validate(UploadSession $session, int $chunkIndex, UploadedFile $chunk): void
    {
        if (!$session->isActive()) {
            throw new UploadException('upload_not_active', 'Upload session is not active.', false, 409);
        }

        if ($chunkIndex < 0 || $chunkIndex >= $session->getTotalChunks()) {
            throw new UploadException('invalid_chunk', 'Chunk index is out of range.');
        }

        if ($chunk->getSize() === false || $chunk->getSize() <= 0) {
            throw new UploadException('invalid_chunk', 'Chunk must not be empty.');
        }

        if ($chunk->getSize() > $this->chunkSize) {
            throw new UploadException('chunk_too_large', 'Chunk exceeds the fixed 1MB limit.', false, 413);
        }

        $expectedSize = min($this->chunkSize, $session->getFileSize() - ($chunkIndex * $this->chunkSize));
        if ($chunk->getSize() !== $expectedSize) {
            throw new UploadException(
                'invalid_chunk',
                sprintf('Chunk %d must be exactly %d byte(s).', $chunkIndex, $expectedSize)
            );
        }
    }
}
