<?php

namespace App\Tests\Service;

use App\Entity\UploadSession;
use App\Service\Storage\LocalMediaStorage;
use PHPUnit\Framework\TestCase;

final class LocalMediaStorageTest extends TestCase
{
    public function testChunkPathUsesServerGeneratedSessionIdNotClientFilename(): void
    {
        $session = new UploadSession('../../evil.jpg', 'image/jpeg', 1048576, null, 1048576, 1);
        $storage = new LocalMediaStorage('/tmp/uploads', '/tmp/media');

        $path = $storage->chunkPath($session, 7);

        self::assertStringContainsString($session->getId(), $path);
        self::assertStringContainsString('chunk_000007.part', $path);
        self::assertStringNotContainsString('evil.jpg', $path);
        self::assertStringNotContainsString('..', basename($path));
    }
}
