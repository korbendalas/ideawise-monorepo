<?php

namespace App\Repository;

use App\Entity\MediaFile;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<MediaFile> */
final class MediaFileRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MediaFile::class);
    }

    /** @return MediaFile[] */
    public function findExpired(DateTimeImmutable $now): array
    {
        return $this->createQueryBuilder('m')
            ->andWhere('m.expiresAt < :now')
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult();
    }
}
