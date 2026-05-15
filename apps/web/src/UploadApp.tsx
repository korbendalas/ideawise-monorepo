import { UploadManager, validateFiles } from "@media-upload/upload-client";
import { useMemo, useState } from "react";

const maxFileSizeBytes = 250 * 1024 * 1024;

export function UploadApp() {
  const manager = useMemo(() => new UploadManager(), []);
  const [messages, setMessages] = useState<string[]>([]);

  function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    const selected = Array.from(files);
    const errors = validateFiles(selected, { maxFileSizeBytes });

    if (errors.length > 0) {
      setMessages(errors.map((error) => error.message));
      return;
    }

    const tasks = selected.map((file) =>
      manager.addFile({
        name: file.name,
        size: file.size,
        type: file.type,
        previewUri: URL.createObjectURL(file)
      })
    );

    setMessages(tasks.map((task) => `${task.file.name}: queued in ${task.totalChunks} chunks`));
  }

  return (
    <main className="shell">
      <section className="uploadPanel">
        <h1>Media Upload System</h1>
        <p>React web client scaffold for chunked image and video uploads.</p>
        <label className="dropzone">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(event) => handleFiles(event.currentTarget.files)}
          />
          <span>Select or drop media files</span>
        </label>
        <div className="messages">
          {messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
