import type { UploadSource } from "@media-upload/upload-client";

export type PickerAssetLike = {
  uri: string;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
};

export function normalizePickerAsset(asset: PickerAssetLike, blob?: Blob): UploadSource {
  const name = asset.fileName ?? nameFromUri(asset.uri);
  const type = asset.mimeType ?? blob?.type ?? inferMimeType(name);
  const source: UploadSource = {
    name,
    size: blob?.size ?? asset.fileSize ?? 0,
    type,
    uri: asset.uri,
    previewUri: asset.uri
  };

  if (blob) {
    source.slice = (start, end) => blob.slice(start, end);
  }

  return source;
}

export async function createUploadSourceFromPickerAsset(asset: PickerAssetLike): Promise<UploadSource> {
  const response = await fetch(asset.uri);
  const blob = await response.blob();

  return normalizePickerAsset(asset, blob);
}

function nameFromUri(uri: string): string {
  const cleanUri = uri.split("?")[0] ?? uri;
  const lastSegment = cleanUri.split("/").filter(Boolean).pop();
  return lastSegment && lastSegment.includes(".") ? lastSegment : "selected-media";
}

function inferMimeType(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase();

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }

  if (extension === "mov" || extension === "m4v") {
    return "video/quicktime";
  }

  if (extension === "mp4") {
    return "video/mp4";
  }

  return "application/octet-stream";
}
