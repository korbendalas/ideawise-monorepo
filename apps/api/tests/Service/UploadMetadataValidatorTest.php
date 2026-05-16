<?php

namespace App\Tests\Service;

use App\Exception\UploadException;
use App\Service\Validation\UploadMetadataValidator;
use PHPUnit\Framework\TestCase;

final class UploadMetadataValidatorTest extends TestCase
{
    public function testAcceptsImageAndVideoMimeTypes(): void
    {
        $validator = new UploadMetadataValidator(1048576);

        $validator->validate([
            'fileName' => 'photo.jpg',
            'fileSize' => 1048576,
            'mimeType' => 'image/jpeg',
            'totalChunks' => 1,
            'chunkSize' => 1048576,
        ]);

        $this->addToAssertionCount(1);
    }

    public function testRejectsNonMediaMimeTypes(): void
    {
        $validator = new UploadMetadataValidator(1048576);

        $this->expectException(UploadException::class);
        $this->expectExceptionMessage('Only image and video uploads are allowed.');

        $validator->validate([
            'fileName' => 'document.pdf',
            'fileSize' => 1048576,
            'mimeType' => 'application/pdf',
            'totalChunks' => 1,
            'chunkSize' => 1048576,
        ]);
    }

    public function testRejectsWrongChunkSize(): void
    {
        $validator = new UploadMetadataValidator(1048576);

        $this->expectException(UploadException::class);
        $this->expectExceptionMessage('Chunk size must be exactly 1MB.');

        $validator->validate([
            'fileName' => 'video.mp4',
            'fileSize' => 1048576,
            'mimeType' => 'video/mp4',
            'totalChunks' => 1,
            'chunkSize' => 2048,
        ]);
    }

    public function testRejectsEmptyFileWithSpecificErrorCode(): void
    {
        $validator = new UploadMetadataValidator(1048576);

        try {
            $validator->validate([
                'fileName' => 'empty.jpg',
                'fileSize' => 0,
                'mimeType' => 'image/jpeg',
                'totalChunks' => 0,
                'chunkSize' => 1048576,
            ]);

            self::fail('Expected empty file metadata to be rejected.');
        } catch (UploadException $exception) {
            self::assertSame('invalid_file_size', $exception->getErrorCode());
            self::assertSame('File must not be empty.', $exception->getMessage());
        }
    }
}
