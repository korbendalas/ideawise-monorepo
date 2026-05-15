<?php

namespace App\Controller;

use App\Exception\UploadException;
use App\Http\JsonErrorResponder;
use App\Repository\UploadSessionRepository;
use App\Service\Upload\UploadStatusService;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[OA\Tag(name: 'Uploads')]
final class UploadStatusController
{
    public function __construct(
        private readonly UploadSessionRepository $sessions,
        private readonly UploadStatusService $service,
        private readonly JsonErrorResponder $errors,
    ) {
    }

    #[OA\Get(
        path: '/api/uploads/{uploadId}/status',
        operationId: 'getUploadStatus',
        summary: 'Query upload session status',
        description: 'Returns the current status of an upload session including received chunk indexes. Poll this endpoint to display progress.',
        parameters: [
            new OA\Parameter(name: 'uploadId', in: 'path', required: true, schema: new OA\Schema(type: 'string'), example: 'a3f1c2e4b5d6...'),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Upload session status',
                content: new OA\JsonContent(ref: '#/components/schemas/UploadStatusResponse')
            ),
            new OA\Response(
                response: 404,
                description: 'Upload session not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
        ]
    )]
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
