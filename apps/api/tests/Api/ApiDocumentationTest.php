<?php

namespace App\Tests\Api;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class ApiDocumentationTest extends WebTestCase
{
    public function testOpenApiDocumentDescribesUploadContract(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/doc.json');

        self::assertResponseIsSuccessful();

        $document = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('3.0.0', $document['openapi']);
        self::assertArrayHasKey('/api/uploads/initiate', $document['paths']);
        self::assertArrayHasKey('/api/uploads/{uploadId}/chunks/{chunkIndex}', $document['paths']);
        self::assertArrayHasKey('/api/uploads/{uploadId}/status', $document['paths']);
        self::assertArrayHasKey('/api/uploads/{uploadId}/finalize', $document['paths']);
        self::assertArrayHasKey('/api/uploads/{uploadId}', $document['paths']);

        $initiate = $document['paths']['/api/uploads/initiate']['post'];
        self::assertSame('initiateUpload', $initiate['operationId']);
        self::assertSame(
            '#/components/schemas/InitiateUploadRequest',
            $initiate['requestBody']['content']['application/json']['schema']['$ref']
        );
        self::assertSame(
            '#/components/schemas/InitiateUploadResponse',
            $initiate['responses']['200']['content']['application/json']['schema']['$ref']
        );
        self::assertSame(
            '#/components/schemas/ErrorResponse',
            $initiate['responses']['400']['content']['application/json']['schema']['$ref']
        );

        $chunk = $document['paths']['/api/uploads/{uploadId}/chunks/{chunkIndex}']['put'];
        self::assertSame('uploadChunk', $chunk['operationId']);
        self::assertSame(
            'binary',
            $chunk['requestBody']['content']['multipart/form-data']['schema']['properties']['chunk']['format']
        );
        self::assertSame(
            '#/components/schemas/ErrorResponse',
            $chunk['responses']['413']['content']['application/json']['schema']['$ref']
        );

        self::assertArrayHasKey('UploadedFile', $document['components']['schemas']);
        self::assertArrayHasKey('ErrorResponse', $document['components']['schemas']);
    }
}
