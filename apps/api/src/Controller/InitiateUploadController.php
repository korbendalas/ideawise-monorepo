<?php

namespace App\Controller;

use App\Exception\UploadException;
use App\Http\JsonErrorResponder;
use App\Http\UploadRateLimiter;
use App\Service\Upload\UploadInitiationService;
use JsonException;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class InitiateUploadController
{
    public function __construct(
        private readonly UploadInitiationService $service,
        private readonly JsonErrorResponder $errors,
        private readonly UploadRateLimiter $rateLimiter,
        private readonly LoggerInterface $logger,
    ) {
    }

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
