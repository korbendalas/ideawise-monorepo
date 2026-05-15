<?php

namespace App\Controller;

use App\Exception\UploadException;
use App\Http\JsonErrorResponder;
use App\Http\UploadRateLimiter;
use App\Repository\UploadSessionRepository;
use App\Service\Upload\ChunkStorageService;
use OpenApi\Attributes as OA;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[OA\Tag(name: 'Uploads')]
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

    #[OA\Put(
        path: '/api/uploads/{uploadId}/chunks/{chunkIndex}',
        operationId: 'uploadChunk',
        summary: 'Upload a single chunk',
        description: 'Send one chunk as multipart/form-data with the field name `chunk`. Chunks may be sent in parallel (max 3 concurrent). Re-uploading an already received chunk is a no-op.',
        parameters: [
            new OA\Parameter(name: 'uploadId',   in: 'path', required: true, schema: new OA\Schema(type: 'string'), example: 'a3f1c2e4b5d6...'),
            new OA\Parameter(name: 'chunkIndex', in: 'path', required: true, schema: new OA\Schema(type: 'integer', minimum: 0), description: 'Zero-based chunk index'),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['chunk'],
                    properties: [
                        new OA\Property(property: 'chunk', type: 'string', format: 'binary', description: 'Raw chunk bytes up to 1 MB. Only the final chunk may be smaller.'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Chunk received',
                content: new OA\JsonContent(ref: '#/components/schemas/ChunkUploadResponse')
            ),
            new OA\Response(
                response: 400,
                description: 'Invalid chunk index, missing file field, empty chunk, or non-final chunk with wrong size.',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 404,
                description: 'Upload session not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 409,
                description: 'Upload session is not active',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 413,
                description: 'Chunk exceeds 1 MB limit',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 429,
                description: 'Rate limit exceeded',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
        ]
    )]
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
