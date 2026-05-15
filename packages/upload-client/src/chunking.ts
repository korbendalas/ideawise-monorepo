import { CHUNK_SIZE_BYTES } from "@media-upload/shared-types";

export type ChunkDescriptor = {
  index: number;
  start: number;
  end: number;
  size: number;
};

export function getTotalChunks(fileSize: number, chunkSize = CHUNK_SIZE_BYTES): number {
  if (fileSize <= 0) {
    return 0;
  }

  return Math.ceil(fileSize / chunkSize);
}

export function createChunkDescriptors(fileSize: number, chunkSize = CHUNK_SIZE_BYTES): ChunkDescriptor[] {
  const totalChunks = getTotalChunks(fileSize, chunkSize);

  return Array.from({ length: totalChunks }, (_, index) => {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, fileSize);

    return {
      index,
      start,
      end,
      size: end - start
    };
  });
}
