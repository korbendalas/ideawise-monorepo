<?php

namespace App\Service\Upload;

use App\Entity\UploadSession;
use App\Repository\MediaFileRepository;
use App\Repository\UploadSessionRepository;
use App\Service\Storage\LocalMediaStorage;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

final class UploadCleanupService
{
    public function __construct(
        private readonly UploadSessionRepository $sessions,
        private readonly MediaFileRepository $mediaFiles,
        private readonly LocalMediaStorage $storage,
        private readonly EntityManagerInterface $entityManager,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function cleanupIncomplete(DateTimeImmutable $now = new DateTimeImmutable()): int
    {
        $expired = $this->sessions->findExpiredIncomplete($now);

        foreach ($expired as $session) {
            $this->storage->deleteUploadTmp($session);
            $session->setStatus(UploadSession::STATUS_EXPIRED);
            $this->logger->info('Expired incomplete upload session.', ['uploadId' => $session->getId()]);
        }

        $this->entityManager->flush();

        return count($expired);
    }

    public function cleanupExpiredMedia(DateTimeImmutable $now = new DateTimeImmutable()): int
    {
        $expired = $this->mediaFiles->findExpired($now);

        foreach ($expired as $file) {
            $this->storage->deletePath($file->getStoragePath());
            $this->entityManager->remove($file);
            $this->logger->info('Deleted expired media file.', ['fileId' => $file->getId()]);
        }

        $this->entityManager->flush();

        return count($expired);
    }
}
