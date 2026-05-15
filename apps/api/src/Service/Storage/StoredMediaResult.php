<?php

namespace App\Service\Storage;

final readonly class StoredMediaResult
{
    public function __construct(
        public string $storedFileName,
        public string $storagePath,
        public string $publicUrl,
    ) {
    }
}
