export const getPreviewFallbackLabel = (fileType: string): string =>
  fileType.startsWith("video/") ? "VID" : "IMG";

export const getTaskDetailsLabel = ({
  fileSizeLabel,
  fileType,
  totalChunks,
}: {
  fileSizeLabel: string;
  fileType: string;
  totalChunks: number;
}): string =>
  `${fileSizeLabel} / ${fileType || "unknown"} / ${totalChunks} chunks`;
