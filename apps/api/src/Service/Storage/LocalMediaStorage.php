<?php

namespace App\Service\Storage;

use App\Entity\UploadSession;
use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;

final class LocalMediaStorage
{
    public function __construct(
        private readonly string $tmpRoot,
        private readonly string $mediaRoot,
    ) {
    }

    public function chunkPath(UploadSession $session, int $chunkIndex): string
    {
        return sprintf('%s/%s/chunk_%06d.part', rtrim($this->tmpRoot, '/'), $session->getId(), $chunkIndex);
    }

    public function ensureUploadTmpDir(UploadSession $session): void
    {
        $this->ensureDir(dirname($this->chunkPath($session, 0)));
    }

    public function writeChunk(UploadSession $session, int $chunkIndex, string $uploadedPath): string
    {
        $this->ensureUploadTmpDir($session);
        $target = $this->chunkPath($session, $chunkIndex);

        if (!move_uploaded_file($uploadedPath, $target) && !rename($uploadedPath, $target)) {
            throw new RuntimeException('Unable to store uploaded chunk.');
        }

        return $target;
    }

    /** @param string[] $chunkPaths */
    public function reassemble(array $chunkPaths, string $targetPath): void
    {
        $this->ensureDir(dirname($targetPath));
        $output = fopen($targetPath, 'wb');

        if ($output === false) {
            throw new RuntimeException('Unable to create reassembled file.');
        }

        foreach ($chunkPaths as $chunkPath) {
            $input = fopen($chunkPath, 'rb');
            if ($input === false) {
                fclose($output);
                throw new RuntimeException('Unable to read chunk during reassembly.');
            }

            stream_copy_to_stream($input, $output);
            fclose($input);
        }

        fclose($output);
    }

    public function storeFinalFile(string $sourcePath, string $checksum, string $mimeType): StoredMediaResult
    {
        $datePath = date('Y/m/d');
        $extension = $this->extensionForMime($mimeType);
        $storedFileName = sprintf('%s.%s', $checksum, $extension);
        $relativePath = sprintf('%s/%s', $datePath, $storedFileName);
        $targetPath = sprintf('%s/%s', rtrim($this->mediaRoot, '/'), $relativePath);

        $this->ensureDir(dirname($targetPath));
        $this->moveFile($sourcePath, $targetPath);

        return new StoredMediaResult(
            $storedFileName,
            $targetPath,
            sprintf('/media/%s', $relativePath),
        );
    }

    public function deleteUploadTmp(UploadSession $session): void
    {
        $dir = dirname($this->chunkPath($session, 0));
        $this->deletePath($dir);
    }

    public function deletePath(string $path): void
    {
        if (!file_exists($path)) {
            return;
        }

        if (is_file($path)) {
            @unlink($path);
            return;
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($iterator as $item) {
            $item->isDir() ? @rmdir($item->getPathname()) : @unlink($item->getPathname());
        }

        @rmdir($path);
    }

    private function ensureDir(string $dir): void
    {
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new RuntimeException(sprintf('Unable to create directory: %s.', $dir));
        }
    }

    private function moveFile(string $sourcePath, string $targetPath): void
    {
        if (@rename($sourcePath, $targetPath)) {
            return;
        }

        if (@copy($sourcePath, $targetPath)) {
            @unlink($sourcePath);
            return;
        }

        throw new RuntimeException(sprintf('Unable to store final media file at %s.', $targetPath));
    }

    private function extensionForMime(string $mimeType): string
    {
        return match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'video/mp4' => 'mp4',
            'video/quicktime' => 'mov',
            default => 'bin',
        };
    }
}
