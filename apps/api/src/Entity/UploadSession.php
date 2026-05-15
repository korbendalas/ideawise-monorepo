<?php

namespace App\Entity;

use App\Repository\UploadSessionRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UploadSessionRepository::class)]
#[ORM\Table(name: 'upload_sessions')]
class UploadSession
{
    public const STATUS_INITIALIZED = 'initialized';
    public const STATUS_UPLOADING = 'uploading';
    public const STATUS_FINALIZING = 'finalizing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_EXPIRED = 'expired';

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 32)]
    private string $id;

    #[ORM\Column(type: 'string', length: 255)]
    private string $originalFileName;

    #[ORM\Column(type: 'string', length: 120)]
    private string $mimeTypeFromClient;

    #[ORM\Column(type: 'integer')]
    private int $fileSize;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $clientChecksum;

    #[ORM\Column(type: 'integer')]
    private int $chunkSize;

    #[ORM\Column(type: 'integer')]
    private int $totalChunks;

    #[ORM\Column(type: 'string', length: 32)]
    private string $status = self::STATUS_INITIALIZED;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $expiresAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $completedAt = null;

    /** @var Collection<int, UploadChunk> */
    #[ORM\OneToMany(mappedBy: 'uploadSession', targetEntity: UploadChunk::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $chunks;

    public function __construct(string $originalFileName, string $mimeTypeFromClient, int $fileSize, ?string $clientChecksum, int $chunkSize, int $totalChunks)
    {
        $now = new DateTimeImmutable();
        $this->id = bin2hex(random_bytes(16));
        $this->originalFileName = $originalFileName;
        $this->mimeTypeFromClient = $mimeTypeFromClient;
        $this->fileSize = $fileSize;
        $this->clientChecksum = $clientChecksum;
        $this->chunkSize = $chunkSize;
        $this->totalChunks = $totalChunks;
        $this->expiresAt = $now->modify('+30 minutes');
        $this->createdAt = $now;
        $this->updatedAt = $now;
        $this->chunks = new ArrayCollection();
    }

    public function getId(): string { return $this->id; }
    public function getOriginalFileName(): string { return $this->originalFileName; }
    public function getMimeTypeFromClient(): string { return $this->mimeTypeFromClient; }
    public function getFileSize(): int { return $this->fileSize; }
    public function getClientChecksum(): ?string { return $this->clientChecksum; }
    public function getChunkSize(): int { return $this->chunkSize; }
    public function getTotalChunks(): int { return $this->totalChunks; }
    public function getStatus(): string { return $this->status; }
    public function getExpiresAt(): DateTimeImmutable { return $this->expiresAt; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): DateTimeImmutable { return $this->updatedAt; }
    public function getCompletedAt(): ?DateTimeImmutable { return $this->completedAt; }

    /** @return Collection<int, UploadChunk> */
    public function getChunks(): Collection
    {
        return $this->chunks;
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
        $this->touch();

        if ($status === self::STATUS_COMPLETED) {
            $this->completedAt = new DateTimeImmutable();
        }
    }

    public function expireNow(): void
    {
        $this->expiresAt = new DateTimeImmutable('-1 second');
        $this->touch();
    }

    public function touch(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }

    public function isActive(): bool
    {
        return in_array($this->status, [self::STATUS_INITIALIZED, self::STATUS_UPLOADING], true);
    }
}
