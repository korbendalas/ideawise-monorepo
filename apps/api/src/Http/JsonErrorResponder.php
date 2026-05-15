<?php

namespace App\Http;

use App\Exception\UploadException;
use Symfony\Component\HttpFoundation\JsonResponse;

final class JsonErrorResponder
{
    public function fromUploadException(UploadException $exception): JsonResponse
    {
        return new JsonResponse([
            'error' => [
                'code' => $exception->getErrorCode(),
                'message' => $exception->getMessage(),
                'retryable' => $exception->isRetryable(),
            ],
        ], $exception->getStatusCode());
    }

    public function rateLimited(): JsonResponse
    {
        return new JsonResponse([
            'error' => [
                'code' => 'rate_limited',
                'message' => 'Upload rate limit exceeded. Please retry later.',
                'retryable' => true,
            ],
        ], 429);
    }
}
