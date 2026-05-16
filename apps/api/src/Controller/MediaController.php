<?php

namespace App\Controller;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class MediaController
{
    public function __construct(
        #[Autowire('%upload.media_dir%')]
        private readonly string $mediaRoot,
    ) {
    }

    #[Route('/media/{path}', requirements: ['path' => '.+'], methods: ['GET'])]
    public function __invoke(string $path): Response
    {
        if (str_contains($path, '..') || str_starts_with($path, '/')) {
            return new Response('Not found.', Response::HTTP_NOT_FOUND);
        }

        $mediaRoot = realpath($this->mediaRoot);
        $filePath = realpath(rtrim($this->mediaRoot, '/').'/'.$path);

        if ($mediaRoot === false || $filePath === false || !str_starts_with($filePath, $mediaRoot.DIRECTORY_SEPARATOR) || !is_file($filePath)) {
            return new Response('Not found.', Response::HTTP_NOT_FOUND);
        }

        return new BinaryFileResponse($filePath);
    }
}
