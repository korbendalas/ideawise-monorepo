<?php

namespace App\Controller;

use App\Entity\UploadSession;
use App\Exception\UploadException;
use App\Http\JsonErrorResponder;
use App\Http\UploadRateLimiter;
use App\Repository\UploadSessionRepository;
use App\Service\Storage\LocalMediaStorage;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class CancelUploadController
{
    public function __construct(
        private readonly UploadSessionRepository $sessions,
        private readonly LocalMediaStorage $storage,
        private readonly EntityManagerInterface $entityManager,
        private readonly JsonErrorResponder $errors,
        private readonly UploadRateLimiter $rateLimiter,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[Route('/api/uploads/{uploadId}', methods: ['DELETE'])]
    public function __invoke(Request $request, string $uploadId): JsonResponse
    {
        if (!$this->rateLimiter->isAllowed($request)) {
            return $this->errors->rateLimited();
        }

        try {
            $session = $this->sessions->find($uploadId);
            if ($session === null) {
                throw new UploadException('upload_not_found', 'Upload session was not found.', false, 404);
            }

            $session->setStatus(UploadSession::STATUS_CANCELLED);
            $this->storage->deleteUploadTmp($session);
            $this->entityManager->flush();
            $this->logger->info('Upload cancelled.', ['uploadId' => $uploadId]);

            return new JsonResponse([
                'uploadId' => $uploadId,
                'status' => 'cancelled',
            ]);
        } catch (UploadException $exception) {
            return $this->errors->fromUploadException($exception);
        }
    }
}
