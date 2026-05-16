import { ApiClient, UploadManager, type UploadSource } from "@media-upload/upload-client";
import { UploadStatus, type UploadTaskSnapshot } from "@media-upload/shared-types";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Metric } from "@/components/Metric";
import { TaskList } from "@/components/TaskList";
import { UploadIntake } from "@/components/UploadIntake";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  deserializeCompletedTasks,
  mergeCompletedTasks,
  serializeCompletedTasks
} from "@/uploadHistory";
import { formatBytes } from "@/utils/format";
import { getSummary } from "@/utils/summary";
import { readCompletedHistory, writeCompletedHistory } from "./UploadApp.utils";

export const UploadApp = () => {
  const previewObjectUrlsRef = useRef(new Set<string>());

  const manager = useMemo(
    () =>
      new UploadManager({
        apiClient: new ApiClient({
          baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api"
        })
      }),
    []
  );

  const [tasks, setTasks] = useState<UploadTaskSnapshot[]>(() => manager.listTasks());
  const [completedHistory, setCompletedHistory] = useState<UploadTaskSnapshot[]>(() =>
    readCompletedHistory()
  );

  useEffect(() => manager.subscribe(setTasks), [manager]);

  const handleFiles = (files: File[]) => {
    for (const file of files) {
      const previewUri = URL.createObjectURL(file);
      previewObjectUrlsRef.current.add(previewUri);
      const source: UploadSource = Object.assign(file, { previewUri });
      const task = manager.addFile(source);
      void manager.start(task.localId);
    }

    toast.success(`${files.length} file${files.length === 1 ? "" : "s"} queued for upload.`);
  };

  const summary = useMemo(() => getSummary(tasks), [tasks]);

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== UploadStatus.Completed && t.status !== UploadStatus.Cancelled),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === UploadStatus.Completed),
    [tasks]
  );

  const persistedCompletedTasks = useMemo(
    () => deserializeCompletedTasks(serializeCompletedTasks(completedTasks)),
    [completedTasks]
  );

  const visibleCompletedTasks = useMemo(
    () => mergeCompletedTasks(completedHistory, persistedCompletedTasks),
    [completedHistory, persistedCompletedTasks]
  );

  // Revoke object URLs for completed/cancelled tasks
  useEffect(() => {
    for (const task of tasks) {
      const { previewUri } = task.file;
      if (!previewUri || !previewObjectUrlsRef.current.has(previewUri)) continue;
      if (task.status === UploadStatus.Completed || task.status === UploadStatus.Cancelled) {
        URL.revokeObjectURL(previewUri);
        previewObjectUrlsRef.current.delete(previewUri);
      }
    }
  }, [tasks]);

  // Cleanup all object URLs on unmount
  useEffect(
    () => () => {
      for (const previewUri of previewObjectUrlsRef.current) {
        URL.revokeObjectURL(previewUri);
      }
      previewObjectUrlsRef.current.clear();
    },
    []
  );

  // Persist completed tasks to localStorage
  useEffect(() => {
    if (completedTasks.length === 0) return;

    setCompletedHistory((current) => {
      const merged = mergeCompletedTasks(current, completedTasks);
      if (serializeCompletedTasks(merged) === serializeCompletedTasks(current)) return current;
      writeCompletedHistory(merged);
      return merged;
    });
  }, [completedTasks]);

  return (
    <TooltipProvider>
      <main className="min-h-screen overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-sm min-w-0 flex-col gap-5 sm:max-w-7xl">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <RefreshCw className="size-4" />
                Chunked media upload console
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-normal text-foreground">
                  Media Upload System
                </h1>
                <p className="mt-1 max-w-2xl text-wrap text-sm leading-6 text-muted-foreground">
                  Upload image and video files through the Symfony backend with fixed-size chunks,
                  resumable controls, retries, and completed media links.
                </p>
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-4">
              <Metric label="Queued" value={summary.queued} />
              <Metric label="Active" value={summary.active} />
              <Metric label="Complete" value={summary.completed} />
              <Metric
                label="Failed"
                value={summary.failed}
                tone={summary.failed > 0 ? "danger" : "default"}
              />
            </div>
          </header>

          <div className="grid min-w-0 gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
            <UploadIntake onFiles={handleFiles} />

            <Card className="min-h-[640px] min-w-0">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Transfer queue</CardTitle>
                    <CardDescription>
                      {formatBytes(summary.uploadedBytes)} of {formatBytes(summary.totalBytes)}{" "}
                      transferred
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {tasks.length} total task{tasks.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" className="flex flex-col gap-4">
                  <TabsList>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active">
                    <TaskList
                      emptyLabel="No active uploads yet."
                      tasks={activeTasks}
                      manager={manager}
                    />
                  </TabsContent>
                  <TabsContent value="completed">
                    <TaskList
                      emptyLabel="Completed media will appear here."
                      tasks={visibleCompletedTasks}
                      manager={manager}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Toaster richColors closeButton />
    </TooltipProvider>
  );
};
