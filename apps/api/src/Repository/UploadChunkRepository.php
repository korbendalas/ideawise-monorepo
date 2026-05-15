<?php

namespace App\Repository;

use App\Entity\UploadChunk;
use App\Entity\UploadSession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<UploadChunk> */
final class UploadChunkRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UploadChunk::class);
    }

    public function findOneForSession(UploadSession $session, int $chunkIndex): ?UploadChunk
    {
        return $this->findOneBy([
            'uploadSession' => $session,
            'chunkIndex' => $chunkIndex,
        ]);
    }

    /** @return int[] */
    public function findIndexesForSession(UploadSession $session): array
    {
        $rows = $this->createQueryBuilder('c')
            ->select('c.chunkIndex')
            ->andWhere('c.uploadSession = :session')
            ->setParameter('session', $session)
            ->orderBy('c.chunkIndex', 'ASC')
            ->getQuery()
            ->getArrayResult();

        return array_map(static fn (array $row): int => (int) $row['chunkIndex'], $rows);
    }

    public function countForSession(UploadSession $session): int
    {
        return (int) $this->createQueryBuilder('c')
            ->select('COUNT(c.id)')
            ->andWhere('c.uploadSession = :session')
            ->setParameter('session', $session)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
