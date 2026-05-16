import { UploadStatus, type UploadTaskSnapshot } from "@media-upload/shared-types";

export const uploadHistoryStorageKey = "media-upload.completed-history.v1";

export const serializeCompletedTasks = (tasks: UploadTaskSnapshot[]): string =>
  JSON.stringify(
    tasks.filter(isCompletedTask).map((task) => ({
      ...task,
      file: {
        name: task.file.name,
        size: task.file.size,
        type: task.file.type,
        uri: task.file.uri,
        checksum: task.file.checksum,
        previewUri: undefined
      }
    }))
  );

export const deserializeCompletedTasks = (value: string | null): UploadTaskSnapshot[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isCompletedTask);
  } catch {
    return [];
  }
};

export const mergeCompletedTasks = (
  persistedTasks: UploadTaskSnapshot[],
  liveTasks: UploadTaskSnapshot[]
): UploadTaskSnapshot[] => {
  const byMediaIdentity = new Map<string, UploadTaskSnapshot>();

  for (const task of persistedTasks.filter(isCompletedTask)) {
    byMediaIdentity.set(getMediaIdentity(task), task);
  }

  for (const task of liveTasks.filter(isCompletedTask)) {
    byMediaIdentity.set(getMediaIdentity(task), task);
  }

  return Array.from(byMediaIdentity.values()).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
};

const isCompletedTask = (value: unknown): value is UploadTaskSnapshot => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const task = value as Partial<UploadTaskSnapshot>;
  return (
    task.status === UploadStatus.Completed &&
    typeof task.localId === "string" &&
    typeof task.file?.name === "string"
  );
};

const getMediaIdentity = (task: UploadTaskSnapshot): string =>
  task.file.uri ?? task.file.checksum ?? task.localId;
