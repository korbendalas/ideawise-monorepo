<?php

namespace App\Controller;

use App\Exception\UploadException;
use App\Http\JsonErrorResponder;
use App\Repository\UploadSessionRepository;
use App\Service\Upload\UploadStatusService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class UploadStatusController
{
    public function __construct(
        private readonly UploadSessionRepository $sessions,
        private readonly UploadStatusService $service,
        private readonly JsonErrorResponder $errors,
    ) {
    }

    #[Route('/api/uploads/{uploadId}/status', methods: ['GET'])]
    public function __invoke(string $uploadId): JsonResponse
    {
        try {
            $session = $this->sessions->find($uploadId);
            if ($session === null) {
                throw new UploadException('upload_not_found', 'Upload session was not found.', false, 404);
            }

            return new JsonResponse($this->service->present($session));
        } catch (UploadException $exception) {
            return $this->errors->fromUploadException($exception);
        }
    }
}
