import type React from "react";
import { useRef, useState } from "react";
import { AlertCircle, UploadCloud } from "lucide-react";
import { validateFiles } from "@media-upload/upload-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Constraint } from "@/components/Constraint";
import type { UploadIntakeProps } from "./UploadIntake.types";
import { MAX_FILE_SIZE_BYTES } from "./UploadIntake.utils";

export const UploadIntake = ({ onFiles }: UploadIntakeProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  const handleFiles = (files: FileList | File[]) => {
    const selected = Array.from(files);
    const errors = validateFiles(selected, { maxFileSizeBytes: MAX_FILE_SIZE_BYTES });

    if (errors.length > 0) {
      setValidationMessages(errors.map((error) => error.message));
      return;
    }

    setValidationMessages([]);
    onFiles(selected);
  };

  return (
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
          onDragEnter={(event: React.DragEvent) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event: React.DragEvent) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event: React.DragEvent) => {
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
  );
};
