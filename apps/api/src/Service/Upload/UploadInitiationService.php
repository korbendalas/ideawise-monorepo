<?php

namespace App\Service\Upload;

use App\Entity\UploadSession;
use App\Repository\MediaFileRepository;
use App\Service\Validation\UploadMetadataValidator;
use Doctrine\ORM\EntityManagerInterface;

final class UploadInitiationService
{
    public function __construct(
        private readonly UploadMetadataValidator $validator,
        private readonly MediaFileRepository $mediaFiles,
        private readonly EntityManagerInterface $entityManager,
        private readonly MediaFilePresenter $presenter,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public function initiate(array $payload): array
    {
        $this->validator->validate($payload);

        $checksum = isset($payload['checksum']) && is_string($payload['checksum']) && trim($payload['checksum']) !== ''
            ? trim($payload['checksum'])
            : null;

        if ($checksum !== null) {
            $existing = $this->mediaFiles->findOneBy(['checksum' => $checksum]);
            if ($existing !== null) {
                return [
                    'uploadId' => null,
                    'status' => 'completed',
                    'alreadyUploaded' => true,
                    'uploadedChunkIndexes' => [],
                    'maxConcurrentChunks' => 3,
                    'chunkSize' => (int) $payload['chunkSize'],
                    'file' => $this->presenter->present($existing),
                ];
            }
        }

        $session = new UploadSession(
            basename((string) $payload['fileName']),
            (string) $payload['mimeType'],
            (int) $payload['fileSize'],
            $checksum,
            (int) $payload['chunkSize'],
            (int) $payload['totalChunks'],
        );

        $this->entityManager->persist($session);
        $this->entityManager->flush();

        return [
            'uploadId' => $session->getId(),
            'status' => $session->getStatus(),
            'alreadyUploaded' => false,
            'uploadedChunkIndexes' => [],
            'maxConcurrentChunks' => 3,
            'chunkSize' => $session->getChunkSize(),
        ];
    }
}
