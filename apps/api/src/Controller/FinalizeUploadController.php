<?php

namespace App\Controller;

use App\Exception\UploadException;
use App\Http\JsonErrorResponder;
use App\Http\UploadRateLimiter;
use App\Repository\UploadSessionRepository;
use App\Service\Upload\UploadFinalizationService;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class FinalizeUploadController
{
    public function __construct(
        private readonly UploadSessionRepository $sessions,
        private readonly UploadFinalizationService $service,
        private readonly JsonErrorResponder $errors,
        private readonly UploadRateLimiter $rateLimiter,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[Route('/api/uploads/{uploadId}/finalize', methods: ['POST'])]
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

            $response = $this->service->finalize($session);
            $this->logger->info('Upload finalized.', ['uploadId' => $uploadId]);

            return new JsonResponse($response);
        } catch (UploadException $exception) {
            $this->logger->warning('Upload finalization failed.', [
                'uploadId' => $uploadId,
                'errorCode' => $exception->getErrorCode(),
            ]);

            return $this->errors->fromUploadException($exception);
        }
    }
}
