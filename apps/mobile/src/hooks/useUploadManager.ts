import { UploadStatus, type UploadTaskSnapshot } from "@media-upload/shared-types";
import { ApiClient, UploadManager, type UploadSource } from "@media-upload/upload-client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MobileUploadManagerState, MobileUploadSummary } from "../types/upload";
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
import { getAsyncStorage } from "../utils/asyncStorage";
import { areTaskListsEqual, summarizeTasks } from "../utils/taskSummary";

// Re-export types for consumers that import from this module.
export type { MobileUploadSummary, MobileUploadManagerState };

// Re-export pure helpers so existing tests continue to work.
export { summarizeTasks } from "../utils/taskSummary";

export const useMobileUploadManager = (): MobileUploadManagerState => {
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
  const draftPersistenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSerializedDraftsRef = useRef(serializeMobileUploadDrafts(tasks));

  useEffect(() => manager.subscribe(setTasks), [manager]);

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== UploadStatus.Completed),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === UploadStatus.Completed),
    [tasks]
  );

  // Load persisted history and draft count on mount
  useEffect(() => {
    let mounted = true;

    void getAsyncStorage().then((storage) =>
      storage.getItem(mobileUploadHistoryKey).then((value) => {
        if (mounted) setCompletedHistory(deserializeMobileUploadHistory(value));
      })
    );

    void getAsyncStorage().then((storage) =>
      storage.getItem(mobileUploadDraftsKey).then((value) => {
        if (mounted) setDraftCount(deserializeMobileUploadDrafts(value).length);
      })
    );

    return () => {
      mounted = false;
    };
  }, []);

  // Persist completed history whenever it changes
  useEffect(() => {
    if (completedTasks.length === 0) return;

    setCompletedHistory((currentHistory) => {
      const merged = mergeCompletedHistoryState(
        currentHistory,
        completedTasks,
        mobileUploadConfig.completedHistoryLimit
      );

      if (merged !== currentHistory) {
        void getAsyncStorage().then((storage) =>
          storage.setItem(mobileUploadHistoryKey, serializeMobileUploadHistory(merged))
        );
      }

      return merged;
    });
  }, [completedTasks]);

  // Debounced draft persistence on task changes
  useEffect(() => {
    const serialized = serializeMobileUploadDrafts(tasks);
    latestSerializedDraftsRef.current = serialized;
    setDraftCount(deserializeMobileUploadDrafts(serialized).length);

    if (draftPersistenceTimerRef.current !== null) {
      clearTimeout(draftPersistenceTimerRef.current);
    }

    draftPersistenceTimerRef.current = setTimeout(() => {
      draftPersistenceTimerRef.current = null;
      void getAsyncStorage().then((storage) =>
        storage.setItem(mobileUploadDraftsKey, latestSerializedDraftsRef.current)
      );
    }, mobileUploadConfig.draftPersistenceDebounceMs);
  }, [tasks]);

  // Flush drafts synchronously on unmount
  useEffect(
    () => () => {
      const pendingDrafts = latestSerializedDraftsRef.current;
      if (draftPersistenceTimerRef.current !== null) {
        clearTimeout(draftPersistenceTimerRef.current);
        draftPersistenceTimerRef.current = null;
      }
      void getAsyncStorage().then((storage) =>
        storage.setItem(mobileUploadDraftsKey, pendingDrafts)
      );
    },
    []
  );

  return {
    tasks,
    activeTasks,
    completedTasks,
    completedHistory: mergeMobileUploadHistory(
      completedHistory,
      completedTasks,
      mobileUploadConfig.completedHistoryLimit
    ),
    draftCount,
    summary: summarizeTasks(tasks),
    queueFiles: (sources: UploadSource[]) =>
      sources.map((source) => {
        const task = manager.addFile(source);
        void manager.start(task.localId);
        return task;
      }),
    pause: (localId) => manager.pause(localId),
    resume: (localId) => manager.resume(localId),
    cancel: (localId) => manager.cancel(localId)
  };
};

/**
 * Merges incoming completed tasks into history, returning the same reference
 * if nothing has changed (prevents unnecessary re-renders and storage writes).
 */
export const mergeCompletedHistoryState = (
  currentHistory: UploadTaskSnapshot[],
  completedTasks: UploadTaskSnapshot[],
  limit: number
): UploadTaskSnapshot[] => {
  const merged = mergeMobileUploadHistory(currentHistory, completedTasks, limit);
  return areTaskListsEqual(currentHistory, merged) ? currentHistory : merged;
};
