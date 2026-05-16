<?php

namespace App\Controller;

use App\Entity\UploadSession;
use App\Exception\UploadException;
use App\Http\JsonErrorResponder;
use App\Http\UploadRateLimiter;
use App\Repository\UploadSessionRepository;
use App\Service\Storage\LocalMediaStorage;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[OA\Tag(name: 'Uploads')]
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

    #[OA\Delete(
        path: '/api/uploads/{uploadId}',
        operationId: 'cancelUpload',
        summary: 'Cancel an upload and remove temporary chunks',
        description: 'Marks the session as cancelled and deletes all temporary chunk files from disk. Idempotent for already-cancelled sessions.',
        parameters: [
            new OA\Parameter(name: 'uploadId', in: 'path', required: true, schema: new OA\Schema(type: 'string', pattern: '^[a-f0-9]{32}$'), example: 'a3f1c2e4b5d64a1f8d6c0e2b9a7f1234'),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Upload cancelled',
                content: new OA\JsonContent(ref: '#/components/schemas/CancelUploadResponse')
            ),
            new OA\Response(
                response: 404,
                description: 'Upload session not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 429,
                description: 'Rate limit exceeded',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
        ]
    )]
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
