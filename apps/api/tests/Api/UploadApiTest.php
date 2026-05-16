<?php

namespace App\Tests\Api;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class UploadApiTest extends WebTestCase
{
    /** @var string[] */
    private array $tempFiles = [];

    protected function setUp(): void
    {
        self::bootKernel();
        $em = self::getContainer()->get(EntityManagerInterface::class);
        $metadata = $em->getMetadataFactory()->getAllMetadata();
        $schemaTool = new SchemaTool($em);

        if ($metadata !== []) {
            $schemaTool->dropSchema($metadata);
            $schemaTool->createSchema($metadata);
        }

        self::ensureKernelShutdown();
    }

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }

        $this->tempFiles = [];

        parent::tearDown();
    }

    public function testInitiateUploadCreatesSession(): void
    {
        $client = $this->createUploadClient();
        $client->request('POST', '/api/uploads/initiate', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'fileName' => 'photo.jpg',
            'fileSize' => 68,
            'mimeType' => 'image/jpeg',
            'totalChunks' => 1,
            'chunkSize' => 1048576,
        ], JSON_THROW_ON_ERROR));

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('initialized', $payload['status']);
        self::assertFalse($payload['alreadyUploaded']);
        self::assertNotEmpty($payload['uploadId']);
    }

    public function testFinalizeFailsWhenChunksAreMissing(): void
    {
        $client = $this->createUploadClient();
        $uploadId = $this->initiate($client, 1048577, 2);

        $client->request('POST', sprintf('/api/uploads/%s/finalize', $uploadId));

        self::assertResponseStatusCodeSame(409);
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('missing_chunks', $payload['error']['code']);
    }

    public function testUploadChunkAndStatusReturnsUploadedIndexes(): void
    {
        $client = $this->createUploadClient();
        $uploadId = $this->initiate($client, 68, 1);
        $chunk = $this->uploadedFileFromString($this->jpegBytes());

        $client->request('PUT', sprintf('/api/uploads/%s/chunks/0', $uploadId), files: ['chunk' => $chunk]);

        self::assertResponseIsSuccessful();

        $client->request('GET', sprintf('/api/uploads/%s/status', $uploadId));

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([0], $payload['uploadedChunkIndexes']);
        self::assertSame(1, $payload['receivedChunks']);
    }

    public function testUploadChunkAcceptsRawPutBody(): void
    {
        $client = $this->createUploadClient();
        $bytes = $this->jpegBytes();
        $uploadId = $this->initiate($client, strlen($bytes), 1);

        $client->request(
            'PUT',
            sprintf('/api/uploads/%s/chunks/0', $uploadId),
            server: ['CONTENT_TYPE' => 'application/octet-stream'],
            content: $bytes
        );

        self::assertResponseIsSuccessful();
    }

    public function testUploadChunkRejectsEmptyRawPutBodyWithChunkError(): void
    {
        $client = $this->createUploadClient();
        $uploadId = $this->initiate($client, 68, 1);

        $client->request(
            'PUT',
            sprintf('/api/uploads/%s/chunks/0', $uploadId),
            server: ['CONTENT_TYPE' => 'application/octet-stream'],
            content: ''
        );

        self::assertResponseStatusCodeSame(400);
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('invalid_chunk', $payload['error']['code']);
        self::assertSame('Chunk body must not be empty.', $payload['error']['message']);
    }

    public function testUploadChunkRejectsOversizedRawPutBodyWhileBuffering(): void
    {
        $client = $this->createUploadClient();
        $uploadId = $this->initiate($client, 1048577, 2);

        $client->request(
            'PUT',
            sprintf('/api/uploads/%s/chunks/0', $uploadId),
            server: ['CONTENT_TYPE' => 'application/octet-stream'],
            content: str_repeat('a', 1048577)
        );

        self::assertResponseStatusCodeSame(413);
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('chunk_too_large', $payload['error']['code']);
    }

    public function testUploadChunkRejectsShortNonFinalChunk(): void
    {
        $client = $this->createUploadClient();
        $uploadId = $this->initiate($client, 1048577, 2);

        $client->request(
            'PUT',
            sprintf('/api/uploads/%s/chunks/0', $uploadId),
            server: ['CONTENT_TYPE' => 'application/octet-stream'],
            content: 'too short'
        );

        self::assertResponseStatusCodeSame(400);
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('invalid_chunk', $payload['error']['code']);
    }

    public function testFinalizeCreatesMediaFile(): void
    {
        $client = $this->createUploadClient();
        $bytes = $this->jpegBytes();
        $uploadId = $this->initiate($client, strlen($bytes), 1);

        $client->request('PUT', sprintf('/api/uploads/%s/chunks/0', $uploadId), files: [
            'chunk' => $this->uploadedFileFromString($bytes),
        ]);
        self::assertResponseIsSuccessful();

        $client->request('POST', sprintf('/api/uploads/%s/finalize', $uploadId));

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('completed', $payload['status']);
        self::assertSame('image/jpeg', $payload['file']['mimeType']);
        $path = rtrim((string) self::getContainer()->getParameter('upload.media_dir'), '/').'/'.str_replace('/media/', '', $payload['file']['url']);
        self::assertFileExists($path);

        $client->request('GET', $payload['file']['url']);
        self::assertResponseIsSuccessful();
    }

    public function testMediaRouteRejectsEncodedTraversal(): void
    {
        $client = $this->createUploadClient();

        $client->request('GET', '/media/%2e%2e/secret.jpg');

        self::assertResponseStatusCodeSame(404);
    }

    private function createUploadClient(): KernelBrowser
    {
        return static::createClient([], [
            'REMOTE_ADDR' => sprintf('10.20.%d.%d', random_int(1, 254), random_int(1, 254)),
        ]);
    }

    private function initiate(KernelBrowser $client, int $fileSize, int $totalChunks): string
    {
        $client->request('POST', '/api/uploads/initiate', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'fileName' => 'photo.jpg',
            'fileSize' => $fileSize,
            'mimeType' => 'image/jpeg',
            'totalChunks' => $totalChunks,
            'chunkSize' => 1048576,
        ], JSON_THROW_ON_ERROR));

        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return $payload['uploadId'];
    }

    private function uploadedFileFromString(string $contents): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'upload-chunk');
        file_put_contents($path, $contents);
        $this->tempFiles[] = $path;

        return new UploadedFile($path, 'chunk.part', 'application/octet-stream', null, true);
    }

    private function jpegBytes(): string
    {
        return base64_decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EFBABAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z', true);
    }
}
