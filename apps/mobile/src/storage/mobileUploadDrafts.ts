import type { UploadTaskSnapshot } from "@media-upload/shared-types";

export const mobileUploadDraftsKey = "media-upload.mobile.drafts.v1";

export type MobileUploadDraft = {
  localId: string;
  uploadId?: string;
  file: {
    name: string;
    size: number;
    type: string;
    uri?: string;
    previewUri?: string;
    checksum?: string;
  };
  status: "queued" | "paused" | "failed";
  uploadedChunkIndexes: number[];
  createdAt: string;
  updatedAt: string;
};

const resumableStatuses = new Set<MobileUploadDraft["status"]>(["queued", "paused", "failed"]);

export function serializeMobileUploadDrafts(tasks: UploadTaskSnapshot[]): string {
  return JSON.stringify(tasks.map(toMobileUploadDraft).filter((draft): draft is MobileUploadDraft => draft !== null));
}

export function deserializeMobileUploadDrafts(value: string | null): MobileUploadDraft[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isMobileUploadDraft) : [];
  } catch {
    return [];
  }
}

export function mergeMobileUploadDrafts(
  existing: MobileUploadDraft[],
  incoming: MobileUploadDraft[],
  limit: number
): MobileUploadDraft[] {
  const byId = new Map<string, MobileUploadDraft>();

  for (const draft of [...existing, ...incoming]) {
    const current = byId.get(draft.localId);
    if (!current || current.updatedAt < draft.updatedAt) {
      byId.set(draft.localId, draft);
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

function toMobileUploadDraft(task: UploadTaskSnapshot): MobileUploadDraft | null {
  if (!isDraftStatus(task.status) || !task.file.uri) {
    return null;
  }

  return {
    localId: task.localId,
    uploadId: task.uploadId,
    file: {
      name: task.file.name,
      size: task.file.size,
      type: task.file.type,
      uri: task.file.uri,
      previewUri: task.file.previewUri,
      checksum: task.file.checksum
    },
    status: task.status,
    uploadedChunkIndexes: task.uploadedChunkIndexes,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

function isDraftStatus(status: UploadTaskSnapshot["status"]): status is MobileUploadDraft["status"] {
  return resumableStatuses.has(status as MobileUploadDraft["status"]);
}

function isMobileUploadDraft(value: unknown): value is MobileUploadDraft {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const draft = value as Partial<MobileUploadDraft>;
  return (
    typeof draft.localId === "string" &&
    typeof draft.file === "object" &&
    draft.file !== null &&
    typeof draft.file.name === "string" &&
    typeof draft.file.size === "number" &&
    typeof draft.file.type === "string" &&
    (draft.status === "queued" || draft.status === "paused" || draft.status === "failed") &&
    Array.isArray(draft.uploadedChunkIndexes) &&
    typeof draft.createdAt === "string" &&
    typeof draft.updatedAt === "string"
  );
}
