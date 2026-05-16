<?php

namespace App\Controller;

use App\Exception\UploadException;
use App\Http\JsonErrorResponder;
use App\Http\UploadRateLimiter;
use App\Repository\UploadSessionRepository;
use App\Service\Upload\UploadFinalizationService;
use OpenApi\Attributes as OA;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[OA\Tag(name: 'Uploads')]
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

    #[OA\Post(
        path: '/api/uploads/{uploadId}/finalize',
        operationId: 'finalizeUpload',
        summary: 'Finalize an upload and reassemble the file',
        description: 'Triggers chunk reassembly, computes the MD5 checksum, runs magic-number MIME validation, deduplicates against existing files, and moves the assembled file to long-term storage.',
        parameters: [
            new OA\Parameter(name: 'uploadId', in: 'path', required: true, schema: new OA\Schema(type: 'string', pattern: '^[a-f0-9]{32}$'), example: 'a3f1c2e4b5d64a1f8d6c0e2b9a7f1234'),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Upload completed',
                content: new OA\JsonContent(ref: '#/components/schemas/FinalizeUploadResponse')
            ),
            new OA\Response(
                response: 404,
                description: 'Upload session not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 409,
                description: 'Session not active or chunks missing',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 422,
                description: 'File content failed server-side MIME validation',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 429,
                description: 'Rate limit exceeded',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
        ]
    )]
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
