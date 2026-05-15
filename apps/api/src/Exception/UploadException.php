<?php

namespace App\Exception;

use RuntimeException;

final class UploadException extends RuntimeException
{
    public function __construct(
        private readonly string $errorCode,
        string $message,
        private readonly bool $retryable = false,
        private readonly int $statusCode = 400,
    ) {
        parent::__construct($message);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function isRetryable(): bool
    {
        return $this->retryable;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
