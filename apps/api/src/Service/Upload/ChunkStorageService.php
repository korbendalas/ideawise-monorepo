<?php

namespace App\Service\Upload;

use App\Entity\UploadChunk;
use App\Entity\UploadSession;
use App\Exception\UploadException;
use App\Repository\UploadChunkRepository;
use App\Service\Storage\LocalMediaStorage;
use App\Service\Validation\ChunkValidator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class ChunkStorageService
{
    public function __construct(
        private readonly ChunkValidator $validator,
        private readonly UploadChunkRepository $chunks,
        private readonly LocalMediaStorage $storage,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function receive(UploadSession $session, int $chunkIndex, ?UploadedFile $chunk): UploadChunk
    {
        if ($chunk === null) {
            throw new UploadException('invalid_chunk', 'Missing multipart chunk file.');
        }

        $this->validator->validate($session, $chunkIndex, $chunk);

        $existing = $this->chunks->findOneForSession($session, $chunkIndex);
        if ($existing !== null) {
            return $existing;
        }

        $size = (int) $chunk->getSize();
        $path = $this->storage->writeChunk($session, $chunkIndex, $chunk->getPathname());
        $record = new UploadChunk($session, $chunkIndex, $size, $path);
        $session->setStatus(UploadSession::STATUS_UPLOADING);

        $this->entityManager->persist($record);
        $this->entityManager->flush();

        return $record;
    }
}
