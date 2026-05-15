<?php

namespace App\Entity;

use App\Repository\MediaFileRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MediaFileRepository::class)]
#[ORM\Table(name: 'media_files')]
#[ORM\UniqueConstraint(name: 'uniq_media_checksum', columns: ['checksum'])]
class MediaFile
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 32)]
    private string $id;

    #[ORM\Column(type: 'string', length: 255)]
    private string $originalFileName;

    #[ORM\Column(type: 'string', length: 255)]
    private string $storedFileName;

    #[ORM\Column(type: 'string', length: 120)]
    private string $mimeType;

    #[ORM\Column(type: 'integer')]
    private int $size;

    #[ORM\Column(type: 'string', length: 128)]
    private string $checksum;

    #[ORM\Column(type: 'string', length: 500)]
    private string $storagePath;

    #[ORM\Column(type: 'string', length: 500)]
    private string $publicUrl;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $expiresAt;

    public function __construct(string $originalFileName, string $storedFileName, string $mimeType, int $size, string $checksum, string $storagePath, string $publicUrl)
    {
        $this->id = bin2hex(random_bytes(16));
        $this->originalFileName = $originalFileName;
        $this->storedFileName = $storedFileName;
        $this->mimeType = $mimeType;
        $this->size = $size;
        $this->checksum = $checksum;
        $this->storagePath = $storagePath;
        $this->publicUrl = $publicUrl;
        $this->createdAt = new DateTimeImmutable();
        $this->expiresAt = $this->createdAt->modify('+30 days');
    }

    public function getId(): string { return $this->id; }
    public function getOriginalFileName(): string { return $this->originalFileName; }
    public function getStoredFileName(): string { return $this->storedFileName; }
    public function getMimeType(): string { return $this->mimeType; }
    public function getSize(): int { return $this->size; }
    public function getChecksum(): string { return $this->checksum; }
    public function getStoragePath(): string { return $this->storagePath; }
    public function getPublicUrl(): string { return $this->publicUrl; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }
    public function getExpiresAt(): DateTimeImmutable { return $this->expiresAt; }
}
