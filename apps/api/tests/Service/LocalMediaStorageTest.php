<?php

namespace App\Tests\Service;

use App\Entity\UploadSession;
use App\Service\Storage\LocalMediaStorage;
use PHPUnit\Framework\TestCase;

final class LocalMediaStorageTest extends TestCase
{
    /** @var string[] */
    private array $pathsToDelete = [];

    protected function tearDown(): void
    {
        foreach ($this->pathsToDelete as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }

        usort($this->pathsToDelete, static fn (string $a, string $b): int => strlen($b) <=> strlen($a));

        foreach ($this->pathsToDelete as $path) {
            if (is_dir($path)) {
                rmdir($path);
            }
        }

        $this->pathsToDelete = [];
    }

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

    public function testStoreFinalFileMovesFileAndReturnsPublicMediaUrl(): void
    {
        $sourcePath = tempnam(sys_get_temp_dir(), 'final-media-source');
        file_put_contents($sourcePath, 'media-bytes');
        $mediaRoot = sys_get_temp_dir().'/media-root-'.bin2hex(random_bytes(6));

        $this->pathsToDelete[] = $sourcePath;
        $this->pathsToDelete[] = $mediaRoot;

        $storage = new LocalMediaStorage(sys_get_temp_dir(), $mediaRoot);
        $stored = $storage->storeFinalFile($sourcePath, 'abcdef1234567890abcdef1234567890', 'image/jpeg');

        self::assertFileDoesNotExist($sourcePath);
        self::assertFileExists($stored->storagePath);
        self::assertSame('media-bytes', file_get_contents($stored->storagePath));
        self::assertStringStartsWith('/media/', $stored->publicUrl);

        $this->pathsToDelete[] = $stored->storagePath;
        $dir = dirname($stored->storagePath);
        while (str_starts_with($dir, $mediaRoot) && $dir !== $mediaRoot) {
            $this->pathsToDelete[] = $dir;
            $dir = dirname($dir);
        }
    }
}
