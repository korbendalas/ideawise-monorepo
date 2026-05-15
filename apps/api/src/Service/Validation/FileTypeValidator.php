<?php

namespace App\Service\Validation;

use App\Exception\UploadException;
use Symfony\Component\Mime\MimeTypes;

final class FileTypeValidator
{
    public function detectAllowedMimeType(string $path): string
    {
        $detected = (new MimeTypes())->guessMimeType($path);

        if ($detected === null || !(str_starts_with($detected, 'image/') || str_starts_with($detected, 'video/'))) {
            throw new UploadException('server_validation_failed', 'Final file content is not a valid image or video.', false, 422);
        }

        return $detected;
    }
}
