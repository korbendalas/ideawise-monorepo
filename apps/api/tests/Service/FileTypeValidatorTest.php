<?php

namespace App\Tests\Service;

use App\Exception\UploadException;
use App\Service\Validation\FileTypeValidator;
use PHPUnit\Framework\TestCase;

final class FileTypeValidatorTest extends TestCase
{
    public function testRejectsSpoofedImageContent(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'spoofed-image');
        file_put_contents($path, 'this is plain text, not an image');

        $this->expectException(UploadException::class);

        try {
            (new FileTypeValidator())->detectAllowedMimeType($path);
        } finally {
            @unlink($path);
        }
    }
}
