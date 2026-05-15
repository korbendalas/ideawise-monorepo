<?php

namespace App\Service\Upload;

use App\Entity\UploadSession;
use App\Repository\UploadChunkRepository;

final class UploadStatusService
{
    public function __construct(private readonly UploadChunkRepository $chunks)
    {
    }

    /** @return array<string, mixed> */
    public function present(UploadSession $session): array
    {
        $indexes = $this->chunks->findIndexesForSession($session);

        return [
            'uploadId' => $session->getId(),
            'status' => $session->getStatus(),
            'fileName' => $session->getOriginalFileName(),
            'totalChunks' => $session->getTotalChunks(),
            'receivedChunks' => count($indexes),
            'uploadedChunkIndexes' => $indexes,
            'expiresAt' => $session->getExpiresAt()->format(DATE_ATOM),
        ];
    }
}
