<?php

namespace App\Entity;

use App\Repository\UploadChunkRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UploadChunkRepository::class)]
#[ORM\Table(name: 'upload_chunks')]
#[ORM\UniqueConstraint(name: 'uniq_upload_chunk_index', columns: ['upload_session_id', 'chunk_index'])]
class UploadChunk
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: UploadSession::class, inversedBy: 'chunks')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private UploadSession $uploadSession;

    #[ORM\Column(type: 'integer')]
    private int $chunkIndex;

    #[ORM\Column(type: 'integer')]
    private int $size;

    #[ORM\Column(type: 'string', length: 500)]
    private string $storagePath;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $receivedAt;

    public function __construct(UploadSession $uploadSession, int $chunkIndex, int $size, string $storagePath)
    {
        $this->uploadSession = $uploadSession;
        $this->chunkIndex = $chunkIndex;
        $this->size = $size;
        $this->storagePath = $storagePath;
        $this->receivedAt = new DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getUploadSession(): UploadSession { return $this->uploadSession; }
    public function getChunkIndex(): int { return $this->chunkIndex; }
    public function getSize(): int { return $this->size; }
    public function getStoragePath(): string { return $this->storagePath; }
    public function getReceivedAt(): DateTimeImmutable { return $this->receivedAt; }
}
