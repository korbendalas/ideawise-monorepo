import { UploadStatus } from "@media-upload/shared-types";
import { FileVideo, ImageIcon, LinkIcon, Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/utils/format";
import { IconButton } from "@/components/IconButton";
import { StatusBadge } from "@/components/StatusBadge";
import type { TaskRowProps } from "./TaskRow.types";

export const TaskRow = ({ task, manager }: TaskRowProps) => {
  const isVideo = task.file.type.startsWith("video/");
  const canPause =
    task.status === UploadStatus.Uploading ||
    task.status === UploadStatus.Retrying ||
    task.status === UploadStatus.Initializing;
  const canResume = task.status === UploadStatus.Paused;
  const canRetry = task.status === UploadStatus.Failed;
  const mediaUrl = task.file.uri;

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
              {formatBytes(task.file.size)} · {task.totalChunks} chunk
              {task.totalChunks === 1 ? "" : "s"} · {task.file.type || "unknown type"}
            </p>
          </div>
          <StatusBadge status={task.status} />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{task.progress.percentage}% complete</span>
            <span>
              {formatBytes(task.progress.uploadedBytes)} /{" "}
              {formatBytes(task.progress.totalBytes)}
            </span>
          </div>
          <Progress value={task.progress.percentage} />
          {task.error ? (
            <p className="text-xs text-destructive">{task.error.message}</p>
          ) : null}
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
        {task.status !== UploadStatus.Completed && task.status !== UploadStatus.Cancelled ? (
          <IconButton label="Cancel upload" onClick={() => void manager.cancel(task.localId)}>
            <Trash2 />
          </IconButton>
        ) : null}
      </div>
    </article>
  );
};
