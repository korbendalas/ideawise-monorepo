<?php

namespace App\Service\Upload;

use App\Entity\MediaFile;
use App\Entity\UploadSession;
use App\Exception\UploadException;
use App\Repository\MediaFileRepository;
use App\Repository\UploadChunkRepository;
use App\Service\Storage\LocalMediaStorage;
use App\Service\Validation\FileTypeValidator;
use Doctrine\ORM\EntityManagerInterface;

final class UploadFinalizationService
{
    public function __construct(
        private readonly UploadChunkRepository $chunks,
        private readonly MediaFileRepository $mediaFiles,
        private readonly LocalMediaStorage $storage,
        private readonly FileTypeValidator $fileTypeValidator,
        private readonly EntityManagerInterface $entityManager,
        private readonly MediaFilePresenter $presenter,
    ) {
    }

    /** @return array<string, mixed> */
    public function finalize(UploadSession $session): array
    {
        if (!in_array($session->getStatus(), [UploadSession::STATUS_INITIALIZED, UploadSession::STATUS_UPLOADING], true)) {
            throw new UploadException('upload_not_active', 'Upload session cannot be finalized in its current state.', false, 409);
        }

        $records = $this->chunks->findBy(['uploadSession' => $session], ['chunkIndex' => 'ASC']);
        if (count($records) !== $session->getTotalChunks()) {
            throw new UploadException('missing_chunks', 'Upload cannot be finalized because chunks are missing.', false, 409);
        }

        $expected = range(0, $session->getTotalChunks() - 1);
        $actual = array_map(static fn ($chunk): int => $chunk->getChunkIndex(), $records);
        if ($expected !== $actual) {
            throw new UploadException('missing_chunks', 'Upload cannot be finalized because chunk indexes are incomplete.', false, 409);
        }

        $session->setStatus(UploadSession::STATUS_FINALIZING);
        $this->entityManager->flush();

        $chunkPaths = array_map(static fn ($chunk): string => $chunk->getStoragePath(), $records);
        $reassembledPath = dirname($chunkPaths[0]).'/reassembled.bin';
        $this->storage->reassemble($chunkPaths, $reassembledPath);

        $checksum = hash_file('md5', $reassembledPath);
        if ($checksum === false) {
            throw new UploadException('server_validation_failed', 'Unable to calculate final checksum.', false, 500);
        }

        $existing = $this->mediaFiles->findOneBy(['checksum' => $checksum]);
        if ($existing !== null) {
            $this->storage->deletePath($reassembledPath);
            $this->storage->deleteUploadTmp($session);
            $session->setStatus(UploadSession::STATUS_COMPLETED);
            $this->entityManager->flush();

            return [
                'uploadId' => $session->getId(),
                'status' => 'completed',
                'file' => $this->presenter->present($existing),
            ];
        }

        $detectedMime = $this->fileTypeValidator->detectAllowedMimeType($reassembledPath);
        $stored = $this->storage->storeFinalFile($reassembledPath, $checksum, $detectedMime);

        $mediaFile = new MediaFile(
            $session->getOriginalFileName(),
            $stored->storedFileName,
            $detectedMime,
            filesize($stored->storagePath) ?: $session->getFileSize(),
            $checksum,
            $stored->storagePath,
            $stored->publicUrl,
        );

        $session->setStatus(UploadSession::STATUS_COMPLETED);
        $this->entityManager->persist($mediaFile);
        $this->entityManager->flush();
        $this->storage->deleteUploadTmp($session);

        return [
            'uploadId' => $session->getId(),
            'status' => 'completed',
            'file' => $this->presenter->present($mediaFile),
        ];
    }
}
