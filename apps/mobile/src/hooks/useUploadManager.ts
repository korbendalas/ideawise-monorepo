import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import { ApiClient, UploadManager, type UploadSource } from "@media-upload/upload-client";
import { useEffect, useMemo, useState } from "react";
import { mobileUploadConfig } from "../config/uploadConfig";
import {
  deserializeMobileUploadDrafts,
  mobileUploadDraftsKey,
  serializeMobileUploadDrafts
} from "../storage/mobileUploadDrafts";
import {
  deserializeMobileUploadHistory,
  mergeMobileUploadHistory,
  mobileUploadHistoryKey,
  serializeMobileUploadHistory
} from "../storage/mobileUploadHistory";

export type MobileUploadSummary = {
  queued: number;
  active: number;
  completed: number;
  failed: number;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
};

export type MobileUploadManagerState = {
  tasks: UploadTaskSnapshot[];
  activeTasks: UploadTaskSnapshot[];
  completedTasks: UploadTaskSnapshot[];
  completedHistory: UploadTaskSnapshot[];
  draftCount: number;
  summary: MobileUploadSummary;
  queueFiles: (sources: UploadSource[]) => UploadTaskSnapshot[];
  pause: (localId: string) => void;
  resume: (localId: string) => void;
  cancel: (localId: string) => Promise<void>;
};

export function useMobileUploadManager(): MobileUploadManagerState {
  const manager = useMemo(
    () =>
      new UploadManager({
        apiClient: new ApiClient({ baseUrl: mobileUploadConfig.apiBaseUrl })
      }),
    []
  );
  const [tasks, setTasks] = useState<UploadTaskSnapshot[]>(() => manager.listTasks());
  const [completedHistory, setCompletedHistory] = useState<UploadTaskSnapshot[]>([]);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => manager.subscribe(setTasks), [manager]);

  const activeTasks = useMemo(() => tasks.filter((task) => task.status !== "completed"), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === "completed"), [tasks]);

  useEffect(() => {
    let mounted = true;

    void getAsyncStorage().then((storage) =>
      storage.getItem(mobileUploadHistoryKey).then((value) => {
        if (mounted) {
          setCompletedHistory(deserializeMobileUploadHistory(value));
        }
      })
    );

    void getAsyncStorage().then((storage) =>
      storage.getItem(mobileUploadDraftsKey).then((value) => {
        if (mounted) {
          setDraftCount(deserializeMobileUploadDrafts(value).length);
        }
      })
    );

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (completedTasks.length === 0) {
      return;
    }

    setCompletedHistory((currentHistory) => {
      const merged = mergeCompletedHistoryState(currentHistory, completedTasks, mobileUploadConfig.completedHistoryLimit);

      if (merged !== currentHistory) {
        void getAsyncStorage().then((storage) =>
          storage.setItem(mobileUploadHistoryKey, serializeMobileUploadHistory(merged))
        );
      }

      return merged;
    });
  }, [completedTasks]);

  useEffect(() => {
    const serialized = serializeMobileUploadDrafts(tasks);
    const drafts = deserializeMobileUploadDrafts(serialized);
    setDraftCount(drafts.length);
    void getAsyncStorage().then((storage) => storage.setItem(mobileUploadDraftsKey, serialized));
  }, [tasks]);

  return {
    tasks,
    activeTasks,
    completedTasks,
    completedHistory: mergeMobileUploadHistory(completedHistory, completedTasks, mobileUploadConfig.completedHistoryLimit),
    draftCount,
    summary: summarizeTasks(tasks),
    queueFiles: (sources) =>
      sources.map((source) => {
        const task = manager.addFile(source);
        void manager.start(task.localId);
        return task;
      }),
    pause: (localId) => manager.pause(localId),
    resume: (localId) => manager.resume(localId),
    cancel: (localId) => manager.cancel(localId)
  };
}

export function mergeCompletedHistoryState(
  currentHistory: UploadTaskSnapshot[],
  completedTasks: UploadTaskSnapshot[],
  limit: number
): UploadTaskSnapshot[] {
  const merged = mergeMobileUploadHistory(currentHistory, completedTasks, limit);
  return areTaskListsEqual(currentHistory, merged) ? currentHistory : merged;
}

async function getAsyncStorage() {
  const module = await import("@react-native-async-storage/async-storage");
  return module.default;
}

export function summarizeTasks(tasks: UploadTaskSnapshot[]): MobileUploadSummary {
  const uploadedBytes = tasks.reduce((sum, task) => sum + task.progress.uploadedBytes, 0);
  const totalBytes = tasks.reduce((sum, task) => sum + task.progress.totalBytes, 0);

  return {
    queued: tasks.filter((task) => task.status === "queued" || task.status === "initializing").length,
    active: tasks.filter((task) => ["uploading", "retrying", "finalizing"].includes(task.status)).length,
    completed: tasks.filter((task) => task.status === "completed").length,
    failed: tasks.filter((task) => task.status === "failed").length,
    uploadedBytes,
    totalBytes,
    percentage: totalBytes === 0 ? 0 : Math.round((uploadedBytes / totalBytes) * 100)
  };
}

function areTaskListsEqual(left: UploadTaskSnapshot[], right: UploadTaskSnapshot[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((task, index) => {
    const other = right[index];
    return Boolean(other) && task.localId === other.localId && task.status === other.status && task.updatedAt === other.updatedAt;
  });
}
