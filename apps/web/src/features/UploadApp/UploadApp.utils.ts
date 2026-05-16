import {type UploadTaskSnapshot} from "@media-upload/shared-types";
import {deserializeCompletedTasks, serializeCompletedTasks, uploadHistoryStorageKey} from "@/uploadHistory";

export const readCompletedHistory = (): UploadTaskSnapshot[] => {
  if (typeof window === "undefined") return [];
  return deserializeCompletedTasks(window.localStorage.getItem(uploadHistoryStorageKey));
};

export const writeCompletedHistory = (tasks: UploadTaskSnapshot[]): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(uploadHistoryStorageKey, serializeCompletedTasks(tasks));
};
