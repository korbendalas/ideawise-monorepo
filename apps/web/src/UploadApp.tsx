import {
  ApiClient,
  UploadManager,
  validateFiles,
  type UploadSource
} from "@media-upload/upload-client";
import { type UploadStatus, type UploadTaskSnapshot } from "@media-upload/shared-types";
import {
  AlertCircle,
  CheckCircle2,
  FileVideo,
  ImageIcon,
  LinkIcon,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
  UploadCloud,
  XCircle
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  deserializeCompletedTasks,
  mergeCompletedTasks,
  serializeCompletedTasks,
  uploadHistoryStorageKey
} from "./uploadHistory";

const maxFileSizeBytes = 250 * 1024 * 1024;

export function UploadApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
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

  function handleFiles(files: FileList | File[]) {
    const selected = Array.from(files);
    const errors = validateFiles(selected, { maxFileSizeBytes });

    if (errors.length > 0) {
      setValidationMessages(errors.map((error) => error.message));
      toast.error("Some files need attention before upload.");
      return;
    }

    setValidationMessages([]);

    for (const file of selected) {
      const source: UploadSource = Object.assign(file, {
        previewUri: URL.createObjectURL(file)
      });
      const task = manager.addFile(source);
      void manager.start(task.localId);
    }

    toast.success(`${selected.length} file${selected.length === 1 ? "" : "s"} queued for upload.`);
  }

  const summary = useMemo(() => getSummary(tasks), [tasks]);
  const activeTasks = useMemo(() => tasks.filter((task) => task.status !== "completed"), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === "completed"), [tasks]);
  const visibleCompletedTasks = useMemo(
    () => mergeCompletedTasks(completedHistory, completedTasks),
    [completedHistory, completedTasks]
  );

  useEffect(() => {
    if (completedTasks.length === 0) {
      return;
    }

    setCompletedHistory((currentHistory) => {
      const merged = mergeCompletedTasks(currentHistory, completedTasks);
      if (serializeCompletedTasks(merged) === serializeCompletedTasks(currentHistory)) {
        return currentHistory;
      }

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
              <Metric label="Failed" value={summary.failed} tone={summary.failed > 0 ? "danger" : "default"} />
            </div>
          </header>

          <div className="grid min-w-0 gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
            <Card className="min-w-0 h-fit">
              <CardHeader>
                <CardTitle>Upload intake</CardTitle>
                <CardDescription>Images and videos, up to 250 MB per file.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <label
                  className={[
                    "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/35 px-6 text-center transition-colors",
                    isDragging ? "border-primary bg-accent" : "hover:bg-muted/60"
                  ].join(" ")}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    handleFiles(event.dataTransfer.files);
                  }}
                >
                  <input
                    ref={inputRef}
                    className="sr-only"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(event) => {
                      if (event.currentTarget.files) {
                        handleFiles(event.currentTarget.files);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                  <span className="flex size-14 items-center justify-center rounded-lg border bg-background shadow-sm">
                    <UploadCloud className="size-6" />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Drop files here or choose media</span>
                    <span className="max-w-64 text-wrap text-xs text-muted-foreground">
                      1 MB chunks, 3 parallel transfers, retry on transient failures
                    </span>
                  </span>
                  <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                    <UploadCloud data-icon="inline-start" />
                    Select files
                  </Button>
                </label>

                {validationMessages.length > 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertTitle>Validation failed</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 flex flex-col gap-1">
                        {validationMessages.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : null}

                <Separator />

                <div className="grid min-w-0 grid-cols-2 gap-3 text-sm">
                  <Constraint label="Chunk size" value="1 MB" />
                  <Constraint label="Concurrency" value="3 chunks" />
                  <Constraint label="Accepted" value="Image, video" />
                  <Constraint label="Batch limit" value="10 files" />
                </div>
              </CardContent>
            </Card>

            <Card className="min-h-[640px] min-w-0">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Transfer queue</CardTitle>
                    <CardDescription>
                      {formatBytes(summary.uploadedBytes)} of {formatBytes(summary.totalBytes)} transferred
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{tasks.length} total task{tasks.length === 1 ? "" : "s"}</Badge>
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
}

function TaskList({
  tasks,
  manager,
  emptyLabel
}: {
  tasks: UploadTaskSnapshot[];
  manager: UploadManager;
  emptyLabel: string;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed bg-muted/25 p-8 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[520px] pr-3">
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskRow key={task.localId} task={task} manager={manager} />
        ))}
      </div>
    </ScrollArea>
  );
}

function TaskRow({ task, manager }: { task: UploadTaskSnapshot; manager: UploadManager }) {
  const isVideo = task.file.type.startsWith("video/");
  const canPause = task.status === "uploading" || task.status === "retrying" || task.status === "initializing";
  const canResume = task.status === "paused";
  const canRetry = task.status === "failed";
  const mediaUrl = task.file.uri ? normalizeMediaUrl(task.file.uri) : undefined;

  return (
    <article className="grid gap-3 rounded-lg border bg-card p-3 shadow-sm sm:grid-cols-[88px_minmax(0,1fr)_auto]">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md bg-muted">
        {task.file.previewUri && !isVideo ? (
          <img className="size-full object-cover" src={task.file.previewUri} alt="" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isVideo ? <FileVideo className="size-6" /> : <ImageIcon className="size-6" />}
            <span className="text-[11px] font-medium uppercase">{isVideo ? "Video" : "Image"}</span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium">{task.file.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatBytes(task.file.size)} · {task.totalChunks} chunk{task.totalChunks === 1 ? "" : "s"} ·{" "}
              {task.file.type || "unknown type"}
            </p>
          </div>
          <StatusBadge status={task.status} />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{task.progress.percentage}% complete</span>
            <span>
              {formatBytes(task.progress.uploadedBytes)} / {formatBytes(task.progress.totalBytes)}
            </span>
          </div>
          <Progress value={task.progress.percentage} />
          {task.error ? <p className="text-xs text-destructive">{task.error.message}</p> : null}
          {mediaUrl ? (
            <a
              className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
              href={mediaUrl}
              target="_blank"
              rel="noreferrer"
            >
              <LinkIcon className="size-3.5" />
              Open media URL
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:flex-col sm:items-end">
        {canPause ? (
          <IconButton label="Pause upload" onClick={() => manager.pause(task.localId)}>
            <Pause />
          </IconButton>
        ) : null}
        {canResume ? (
          <IconButton label="Resume upload" onClick={() => manager.resume(task.localId)}>
            <Play />
          </IconButton>
        ) : null}
        {canRetry ? (
          <IconButton label="Retry upload" onClick={() => void manager.start(task.localId)}>
            <RotateCcw />
          </IconButton>
        ) : null}
        {task.status !== "completed" && task.status !== "cancelled" ? (
          <IconButton label="Cancel upload" onClick={() => void manager.cancel(task.localId)}>
            <Trash2 />
          </IconButton>
        ) : null}
      </div>
    </article>
  );
}

function IconButton({
  label,
  children,
  onClick
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="outline" size="icon-sm" aria-label={label} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "danger" }) {
  return (
    <div className="min-w-0 rounded-lg border bg-card px-3 py-2 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={tone === "danger" ? "text-xl font-semibold text-destructive" : "text-xl font-semibold"}>
        {value}
      </div>
    </div>
  );
}

function Constraint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: UploadStatus }) {
  if (status === "completed") {
    return (
      <Badge>
        <CheckCircle2 className="size-3.5" />
        Completed
      </Badge>
    );
  }

  if (status === "failed" || status === "cancelled") {
    return (
      <Badge variant="destructive">
        <XCircle className="size-3.5" />
        {labelStatus(status)}
      </Badge>
    );
  }

  return <Badge variant="secondary">{labelStatus(status)}</Badge>;
}

function getSummary(tasks: UploadTaskSnapshot[]) {
  return tasks.reduce(
    (summary, task) => {
      summary.totalBytes += task.progress.totalBytes;
      summary.uploadedBytes += task.progress.uploadedBytes;

      if (task.status === "queued") {
        summary.queued += 1;
      }

      if (["initializing", "uploading", "retrying", "finalizing"].includes(task.status)) {
        summary.active += 1;
      }

      if (task.status === "completed") {
        summary.completed += 1;
      }

      if (task.status === "failed") {
        summary.failed += 1;
      }

      return summary;
    },
    { queued: 0, active: 0, completed: 0, failed: 0, totalBytes: 0, uploadedBytes: 0 }
  );
}

function labelStatus(status: UploadStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

function normalizeMediaUrl(url: string): string {
  if (url.startsWith("http")) {
    return url;
  }

  return url;
}

function readCompletedHistory(): UploadTaskSnapshot[] {
  if (typeof window === "undefined") {
    return [];
  }

  return deserializeCompletedTasks(window.localStorage.getItem(uploadHistoryStorageKey));
}

function writeCompletedHistory(tasks: UploadTaskSnapshot[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(uploadHistoryStorageKey, serializeCompletedTasks(tasks));
}
