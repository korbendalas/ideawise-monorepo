<?php

namespace App\Repository;

use App\Entity\UploadSession;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<UploadSession> */
final class UploadSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UploadSession::class);
    }

    /** @return UploadSession[] */
    public function findExpiredIncomplete(DateTimeImmutable $now): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.expiresAt < :now')
            ->andWhere('s.status NOT IN (:terminal)')
            ->setParameter('now', $now)
            ->setParameter('terminal', [
                UploadSession::STATUS_COMPLETED,
                UploadSession::STATUS_CANCELLED,
                UploadSession::STATUS_EXPIRED,
            ])
            ->getQuery()
            ->getResult();
    }
}
