<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\RateLimiter\RateLimiterFactory;

final class UploadRateLimiter
{
    public function __construct(private readonly RateLimiterFactory $uploadApiLimiter)
    {
    }

    public function isAllowed(Request $request): bool
    {
        $limiter = $this->uploadApiLimiter->create($request->getClientIp() ?? 'anonymous');

        return $limiter->consume(1)->isAccepted();
    }
}
