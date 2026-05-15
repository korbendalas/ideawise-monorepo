<?php

namespace App\Controller;

use App\Exception\UploadException;
use App\Http\JsonErrorResponder;
use App\Http\UploadRateLimiter;
use App\Service\Upload\UploadInitiationService;
use JsonException;
use OpenApi\Attributes as OA;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[OA\Tag(name: 'Uploads')]
final class InitiateUploadController
{
    public function __construct(
        private readonly UploadInitiationService $service,
        private readonly JsonErrorResponder $errors,
        private readonly UploadRateLimiter $rateLimiter,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[OA\Post(
        path: '/api/uploads/initiate',
        operationId: 'initiateUpload',
        summary: 'Initiate a chunked upload session',
        description: 'Pre-checks file metadata and creates an upload session. Supports deduplication via MD5 checksum.',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/InitiateUploadRequest')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Session created (or file already uploaded)',
                content: new OA\JsonContent(ref: '#/components/schemas/InitiateUploadResponse')
            ),
            new OA\Response(
                response: 400,
                description: 'Validation error, invalid JSON, invalid MIME type, wrong chunk count, or wrong chunk size.',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 429,
                description: 'Rate limit exceeded',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
        ]
    )]
    #[Route('/api/uploads/initiate', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        if (!$this->rateLimiter->isAllowed($request)) {
            return $this->errors->rateLimited();
        }

        try {
            $payload = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
            $response = $this->service->initiate(is_array($payload) ? $payload : []);
            $this->logger->info('Upload initiated.', ['uploadId' => $response['uploadId'] ?? null]);

            return new JsonResponse($response);
        } catch (JsonException) {
            return $this->errors->fromUploadException(new UploadException('invalid_request', 'Request body must be valid JSON.'));
        } catch (UploadException $exception) {
            return $this->errors->fromUploadException($exception);
        }
    }
}
