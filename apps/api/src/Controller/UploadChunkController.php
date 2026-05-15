<?php

namespace App\Controller;

use App\Exception\UploadException;
use App\Http\JsonErrorResponder;
use App\Http\UploadRateLimiter;
use App\Repository\UploadSessionRepository;
use App\Service\Upload\ChunkStorageService;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class UploadChunkController
{
    public function __construct(
        private readonly UploadSessionRepository $sessions,
        private readonly ChunkStorageService $service,
        private readonly JsonErrorResponder $errors,
        private readonly UploadRateLimiter $rateLimiter,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[Route('/api/uploads/{uploadId}/chunks/{chunkIndex}', methods: ['PUT'])]
    public function __invoke(Request $request, string $uploadId, int $chunkIndex): JsonResponse
    {
        if (!$this->rateLimiter->isAllowed($request)) {
            return $this->errors->rateLimited();
        }

        try {
            $session = $this->sessions->find($uploadId);
            if ($session === null) {
                throw new UploadException('upload_not_found', 'Upload session was not found.', false, 404);
            }

            $chunk = $this->service->receive($session, $chunkIndex, $request->files->get('chunk'));
            $this->logger->info('Upload chunk received.', [
                'uploadId' => $uploadId,
                'chunkIndex' => $chunk->getChunkIndex(),
            ]);

            return new JsonResponse([
                'uploadId' => $uploadId,
                'chunkIndex' => $chunk->getChunkIndex(),
                'status' => 'received',
            ]);
        } catch (UploadException $exception) {
            return $this->errors->fromUploadException($exception);
        }
    }
}
