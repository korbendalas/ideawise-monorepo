import type { UploadTaskSnapshot } from "@media-upload/shared-types";

export const mobileUploadHistoryKey = "media-upload.mobile.completed-history.v1";

export function serializeMobileUploadHistory(tasks: UploadTaskSnapshot[]): string {
  return JSON.stringify(tasks.filter((task) => task.status === "completed"));
}

export function deserializeMobileUploadHistory(value: string | null): UploadTaskSnapshot[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((task): task is UploadTaskSnapshot => isUploadTaskSnapshot(task) && task.status === "completed")
      : [];
  } catch {
    return [];
  }
}

export function mergeMobileUploadHistory(
  existing: UploadTaskSnapshot[],
  incoming: UploadTaskSnapshot[],
  limit: number
): UploadTaskSnapshot[] {
  const byId = new Map<string, UploadTaskSnapshot>();

  for (const task of [...existing, ...incoming]) {
    if (task.status !== "completed") {
      continue;
    }

    const current = byId.get(task.localId);
    if (!current || current.updatedAt < task.updatedAt) {
      byId.set(task.localId, task);
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

function isUploadTaskSnapshot(value: unknown): value is UploadTaskSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    "localId" in value &&
    "file" in value &&
    "status" in value &&
    "progress" in value &&
    "updatedAt" in value
  );
}
