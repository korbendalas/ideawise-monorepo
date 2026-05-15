<?php

namespace App\Service\Upload;

use App\Entity\MediaFile;

final class MediaFilePresenter
{
    /** @return array<string, mixed> */
    public function present(MediaFile $file): array
    {
        return [
            'id' => $file->getId(),
            'fileName' => $file->getOriginalFileName(),
            'mimeType' => $file->getMimeType(),
            'size' => $file->getSize(),
            'checksum' => $file->getChecksum(),
            'url' => $file->getPublicUrl(),
        ];
    }
}
