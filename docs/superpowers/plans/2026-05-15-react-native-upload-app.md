# React Native Upload App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished Expo/React Native mobile upload app that satisfies the assignment's mobile requirements and presents well in a client/job-interview demo.

**Architecture:** Keep upload protocol logic in `packages/upload-client` and make the mobile app a native-feeling client around that shared engine. Mobile-specific code owns permissions, asset preparation, persistence, background/resume UX, and React Native presentation; it must not fork chunking, retry, or API contract logic from the web app.

**Tech Stack:** Expo SDK 52, React Native 0.76, expo-router, expo-image-picker, AsyncStorage, TypeScript, Node test runner/tsx for unit tests, existing Symfony 6 API.

---

## Recap: Current Monorepo State

### Already Implemented

- Monorepo root uses npm workspaces for `apps/web`, `apps/mobile`, and `packages/*`.
- Symfony backend exists in `apps/api` with REST endpoints for initiate, chunk upload, status, finalize, and cancel.
- Backend includes upload entities, migrations, filesystem storage, magic-number validation, checksum deduplication, 30-minute incomplete upload cleanup, 30-day media cleanup, request logging/rate-limiting hooks, Swagger docs, and PHPUnit tests.
- Shared package `packages/shared-types` defines upload DTOs, status types, chunk size, concurrency, retry, and batch limits.
- Shared package `packages/upload-client` implements validation, API client, chunk descriptors, retry delays, `UploadManager`, max 3 parallel transfers, pause/resume/cancel, and tests.
- React web app in `apps/web` is already a strong upload console: drag/drop, validation, previews, queue UI, progress, controls, completed history in `localStorage`, and shadcn-style UI components.
- Expo app scaffold exists in `apps/mobile` with file picker, camera capture, permission prompts, preview image, a single status text, and shared `UploadManager` integration.
- Mobile helper `apps/mobile/src/screens/uploadSource.ts` normalizes Expo picker assets into `UploadSource`; it already has focused unit tests.

### Gaps Before Client Demo

- Mobile UI is still a simple proof of concept, not yet a polished upload manager.
- Mobile supports only one selected/captured asset at a time in the visible UX.
- There is no mobile queue list with individual progress, overall progress, metadata, status categories, retry indicators, or completion history.
- Pause exists, but resume and cancel are not exposed clearly in the UI.
- Upload state is not persisted in AsyncStorage, so incomplete/completed uploads are not restored after app restart.
- Background upload support is not implemented as a realistic Expo-compatible MVP; this should be represented as best-effort app-state resume plus documented limitation unless native/background modules are added.
- Mobile tests do not yet cover permission denied/accepted flows, queue rendering, controls, or persisted state.
- Mobile documentation needs setup details for simulator/device API base URLs and permission behavior.

## Requirement Coverage Strategy

### Core Mobile MVP

- Native file picker integration: `expo-image-picker` media library.
- Direct camera upload: `expo-image-picker` camera launcher.
- Permission management: explicit camera/media-library permission states and recovery UI.
- Multiple selections: enable 1-10 assets from library and queue each valid asset.
- Validation: reuse `validateFiles()` from `packages/upload-client`.
- Preview and metadata: thumbnail, filename, size, MIME type, chunk count.
- Upload manager: reuse `UploadManager` for 1 MB chunks, max 3 transfers, retry, pause/resume/cancel.
- Feedback: queue status, individual progress, overall progress, success/error banners.
- Persistence: AsyncStorage history for completed tasks and serializable upload session snapshots.
- Background/resume: app-state listener to resume queued/paused incomplete tasks when app returns active; document that true OS-level background transfer requires a native background upload module.

### Explicit Non-Goals For This Phase

- Native iOS/Android background transfer service.
- Authenticated user accounts.
- Push notifications.
- Offline-first chunk cache beyond persisted upload metadata.
- Detox E2E suite; document as future hardening.

## File Structure

### Create

- `apps/mobile/src/config/uploadConfig.ts`: API base URL, max file size, labels, and mobile-safe constants.
- `apps/mobile/src/storage/mobileUploadHistory.ts`: AsyncStorage persistence for completed upload history.
- `apps/mobile/src/storage/mobileUploadDrafts.ts`: Serializable persistence for resumable upload drafts.
- `apps/mobile/src/hooks/useUploadManager.ts`: Own one `UploadManager`, task subscription, derived queue stats, and action wrappers.
- `apps/mobile/src/hooks/useMediaPermissions.ts`: Camera/gallery permission request helpers and user-facing permission states.
- `apps/mobile/src/components/ActionIconButton.tsx`: Reusable compact button for upload row controls.
- `apps/mobile/src/components/UploadIntake.tsx`: Select/capture actions and validation feedback.
- `apps/mobile/src/components/UploadSummary.tsx`: Overall progress and queue status metrics.
- `apps/mobile/src/components/UploadTaskCard.tsx`: File preview, metadata, progress, status badge, pause/resume/cancel.
- `apps/mobile/src/components/UploadQueue.tsx`: Active/completed sections backed by task snapshots and persisted history.
- `apps/mobile/src/components/StatusBanner.tsx`: Categorized error/success/info messages.
- `apps/mobile/src/theme.ts`: Shared spacing, color, typography tokens for a cohesive mobile UI.
- `apps/mobile/src/test/createMockAsset.ts`: Test helper for Expo picker-like assets.
- `apps/mobile/src/hooks/useUploadManager.test.ts`: Upload manager hook behavior with mocked API client.
- `apps/mobile/src/storage/mobileUploadHistory.test.ts`: AsyncStorage serialization and merge behavior.
- `apps/mobile/src/screens/UploadScreen.test.tsx`: Permission, picker, camera, queue rendering, controls.

### Modify

- `apps/mobile/package.json`: Add AsyncStorage and React Native testing dependencies/scripts.
- `apps/mobile/app.json`: Add clear camera/media-library permission messages.
- `apps/mobile/src/screens/uploadSource.ts`: Improve file-name/type fallback and support assets with missing size after blob load.
- `apps/mobile/src/screens/UploadScreen.tsx`: Replace proof-of-concept UI with composed production-ready screen.
- `docs/setup.md`: Add mobile simulator/device setup and `EXPO_PUBLIC_API_BASE_URL` examples.
- `docs/architecture.md`: Clarify mobile persistence/background-resume boundary.
- `docs/testing.md`: Add mobile test commands and manual demo checklist.
- `README.md`: Update project status so reviewers see web, API, and mobile coverage honestly.

## Implementation Tasks

### Task 1: Add Mobile Runtime Dependencies And Configuration

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.json`
- Create: `apps/mobile/src/config/uploadConfig.ts`

- [ ] **Step 1: Install mobile persistence and test libraries**

Run:

```bash
npm install --workspace @media-upload/mobile @react-native-async-storage/async-storage
npm install --workspace @media-upload/mobile --save-dev react-test-renderer @testing-library/react-native @types/react-test-renderer
```

Expected: `apps/mobile/package.json` includes the new dependencies and root `package-lock.json` is updated.

- [ ] **Step 2: Add mobile upload config**

Create `apps/mobile/src/config/uploadConfig.ts`:

```ts
export const mobileUploadConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api",
  maxFileSizeBytes: 250 * 1024 * 1024,
  maxFilesPerBatch: 10,
  completedHistoryLimit: 25
} as const;
```

- [ ] **Step 3: Add permission strings**

Modify `apps/mobile/app.json` so Expo contains reviewable permission copy:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Media Upload System to select images and videos for upload.",
          "cameraPermission": "Allow Media Upload System to capture images and videos for upload.",
          "microphonePermission": "Allow Media Upload System to record audio with captured videos."
        }
      ]
    ]
  }
}
```

- [ ] **Step 4: Verify TypeScript**

Run:

```bash
npm --workspace @media-upload/mobile run typecheck
```

Expected: PASS with no TypeScript errors.

### Task 2: Persist Completed Mobile Upload History

**Files:**
- Create: `apps/mobile/src/storage/mobileUploadHistory.ts`
- Create: `apps/mobile/src/storage/mobileUploadHistory.test.ts`

- [ ] **Step 1: Write history storage tests**

Create `apps/mobile/src/storage/mobileUploadHistory.test.ts`:

```ts
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import {
  deserializeMobileUploadHistory,
  mergeMobileUploadHistory,
  serializeMobileUploadHistory
} from "./mobileUploadHistory";

function task(localId: string, updatedAt: string): UploadTaskSnapshot {
  return {
    localId,
    file: { name: `${localId}.jpg`, size: 10, type: "image/jpeg", previewUri: "file://preview.jpg" },
    status: "completed",
    chunkSize: 1048576,
    totalChunks: 1,
    uploadedChunkIndexes: [0],
    failedChunks: {},
    progress: { uploadedBytes: 10, totalBytes: 10, percentage: 100 },
    createdAt: updatedAt,
    updatedAt
  };
}

beforeEach(() => {
  // Reserved for AsyncStorage mock setup once the integration test imports storage calls.
});

test("serializes and deserializes completed upload history", () => {
  const serialized = serializeMobileUploadHistory([task("a", "2026-05-15T10:00:00.000Z")]);
  assert.equal(deserializeMobileUploadHistory(serialized)[0]?.localId, "a");
});

test("merge de-duplicates by local id and keeps newest items first", () => {
  const merged = mergeMobileUploadHistory(
    [task("a", "2026-05-15T10:00:00.000Z")],
    [task("a", "2026-05-15T11:00:00.000Z"), task("b", "2026-05-15T09:00:00.000Z")],
    10
  );

  assert.deepEqual(
    merged.map((item) => item.localId),
    ["a", "b"]
  );
  assert.equal(merged[0]?.updatedAt, "2026-05-15T11:00:00.000Z");
});
```

- [ ] **Step 2: Implement pure serialization helpers**

Create `apps/mobile/src/storage/mobileUploadHistory.ts`:

```ts
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
      ? parsed.filter((task): task is UploadTaskSnapshot => isUploadTaskSnapshot(task))
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
    "progress" in value
  );
}
```

- [ ] **Step 3: Run storage tests**

Run:

```bash
npm --workspace @media-upload/mobile test -- src/storage/mobileUploadHistory.test.ts
```

Expected: PASS.

### Task 3: Build Upload Manager Hook For Mobile

**Files:**
- Create: `apps/mobile/src/hooks/useUploadManager.ts`
- Create: `apps/mobile/src/hooks/useUploadManager.test.ts`

- [ ] **Step 1: Add hook API**

Create `apps/mobile/src/hooks/useUploadManager.ts` with this public shape:

```ts
import { ApiClient, UploadManager, type UploadSource } from "@media-upload/upload-client";
import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import { useEffect, useMemo, useState } from "react";
import { mobileUploadConfig } from "../config/uploadConfig";

export type MobileUploadManagerState = {
  tasks: UploadTaskSnapshot[];
  activeTasks: UploadTaskSnapshot[];
  completedTasks: UploadTaskSnapshot[];
  summary: {
    queued: number;
    active: number;
    completed: number;
    failed: number;
    uploadedBytes: number;
    totalBytes: number;
    percentage: number;
  };
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

  useEffect(() => manager.subscribe(setTasks), [manager]);

  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  return {
    tasks,
    activeTasks,
    completedTasks,
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

export function summarizeTasks(tasks: UploadTaskSnapshot[]) {
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
```

- [ ] **Step 2: Test summary logic**

Create `apps/mobile/src/hooks/useUploadManager.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import { summarizeTasks } from "./useUploadManager";

function task(status: UploadTaskSnapshot["status"], uploadedBytes: number, totalBytes: number): UploadTaskSnapshot {
  return {
    localId: `${status}-${uploadedBytes}`,
    file: { name: "file.jpg", size: totalBytes, type: "image/jpeg" },
    status,
    chunkSize: 1048576,
    totalChunks: 1,
    uploadedChunkIndexes: uploadedBytes === totalBytes ? [0] : [],
    failedChunks: {},
    progress: { uploadedBytes, totalBytes, percentage: totalBytes === 0 ? 0 : Math.round((uploadedBytes / totalBytes) * 100) },
    createdAt: "2026-05-15T10:00:00.000Z",
    updatedAt: "2026-05-15T10:00:00.000Z"
  };
}

test("summarizeTasks groups mobile upload statuses", () => {
  const summary = summarizeTasks([
    task("queued", 0, 100),
    task("uploading", 50, 100),
    task("completed", 100, 100),
    task("failed", 20, 100)
  ]);

  assert.equal(summary.queued, 1);
  assert.equal(summary.active, 1);
  assert.equal(summary.completed, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.percentage, 43);
});
```

- [ ] **Step 3: Run hook tests**

Run:

```bash
npm --workspace @media-upload/mobile test -- src/hooks/useUploadManager.test.ts
```

Expected: PASS.

### Task 4: Improve Mobile Asset Preparation And Multi-Select

**Files:**
- Modify: `apps/mobile/src/screens/uploadSource.ts`
- Modify: `apps/mobile/src/screens/uploadSource.test.ts`

- [ ] **Step 1: Add tests for missing names, MIME inference, and blob size**

Extend `apps/mobile/src/screens/uploadSource.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePickerAsset } from "./uploadSource";

test("normalizePickerAsset uses blob size when picker file size is missing", () => {
  const blob = new Blob(["hello"], { type: "image/png" });
  const source = normalizePickerAsset({ uri: "file:///camera/capture.png", fileSize: null, mimeType: null }, blob);

  assert.equal(source.name, "capture.png");
  assert.equal(source.size, 5);
  assert.equal(source.type, "image/png");
  assert.equal(typeof source.slice, "function");
});

test("normalizePickerAsset falls back to safe default name and type", () => {
  const source = normalizePickerAsset({ uri: "file:///asset-without-extension", fileName: null, mimeType: null });

  assert.equal(source.name, "selected-media");
  assert.equal(source.type, "application/octet-stream");
});
```

- [ ] **Step 2: Update MIME fallback to prefer blob type**

Modify `normalizePickerAsset` so type selection is:

```ts
const type = asset.mimeType ?? blob?.type ?? inferMimeType(name);
```

- [ ] **Step 3: Run asset tests**

Run:

```bash
npm --workspace @media-upload/mobile test -- src/screens/uploadSource.test.ts
```

Expected: PASS.

### Task 5: Create Mobile UI Components

**Files:**
- Create: `apps/mobile/src/theme.ts`
- Create: `apps/mobile/src/components/ActionIconButton.tsx`
- Create: `apps/mobile/src/components/StatusBanner.tsx`
- Create: `apps/mobile/src/components/UploadSummary.tsx`
- Create: `apps/mobile/src/components/UploadTaskCard.tsx`
- Create: `apps/mobile/src/components/UploadQueue.tsx`

- [ ] **Step 1: Add shared theme tokens**

Create `apps/mobile/src/theme.ts`:

```ts
export const colors = {
  background: "#f6f7f9",
  surface: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
  border: "#d8dee8",
  primary: "#2563eb",
  success: "#15803d",
  warning: "#b45309",
  danger: "#b91c1c"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
} as const;
```

- [ ] **Step 2: Add a status banner**

Create `apps/mobile/src/components/StatusBanner.tsx`:

```tsx
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

export type StatusBannerTone = "info" | "success" | "warning" | "danger";

type Props = {
  tone: StatusBannerTone;
  title: string;
  message: string;
};

export function StatusBanner({ tone, title, message }: Props) {
  return (
    <View style={[styles.container, styles[tone]]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs
  },
  info: { borderColor: colors.border, backgroundColor: colors.surface },
  success: { borderColor: "#86efac", backgroundColor: "#f0fdf4" },
  warning: { borderColor: "#facc15", backgroundColor: "#fefce8" },
  danger: { borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
  title: { color: colors.text, fontSize: 14, fontWeight: "700" },
  message: { color: colors.muted, fontSize: 13, lineHeight: 18 }
});
```

- [ ] **Step 3: Build summary and queue cards**

Implement `UploadSummary`, `UploadTaskCard`, and `UploadQueue` using `UploadTaskSnapshot` props. Each task card must display preview, name, formatted size, MIME type, status, percentage, and buttons for pause/resume/cancel based on status.

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm --workspace @media-upload/mobile run typecheck
```

Expected: PASS.

### Task 6: Replace Mobile Screen With Client-Ready Upload Flow

**Files:**
- Modify: `apps/mobile/src/screens/UploadScreen.tsx`
- Create: `apps/mobile/src/components/UploadIntake.tsx`

- [ ] **Step 1: Implement multi-select intake**

`UploadIntake` must expose two commands:

```ts
type UploadIntakeProps = {
  onPickLibrary: () => Promise<void>;
  onCaptureCamera: () => Promise<void>;
  disabled?: boolean;
};
```

Use `Pressable` or `Button` controls with clear labels: `Choose media` and `Use camera`.

- [ ] **Step 2: Update media library picker options**

In `UploadScreen.tsx`, use:

```ts
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.All,
  allowsMultipleSelection: true,
  selectionLimit: mobileUploadConfig.maxFilesPerBatch,
  quality: 1
});
```

For camera, keep single capture:

```ts
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.All,
  quality: 1
});
```

- [ ] **Step 3: Queue all valid selected assets**

Use:

```ts
const sources = await Promise.all(result.assets.map(createUploadSourceFromPickerAsset));
const errors = validateFiles(sources, { maxFileSizeBytes: mobileUploadConfig.maxFileSizeBytes });

if (errors.length > 0) {
  setBanner({ tone: "danger", title: "Validation failed", message: errors.map((error) => error.message).join(" ") });
  return;
}

queueFiles(sources);
setBanner({ tone: "success", title: "Upload queued", message: `${sources.length} file${sources.length === 1 ? "" : "s"} added to the transfer queue.` });
```

- [ ] **Step 4: Compose the screen**

`UploadScreen` should render:

- Safe area and `ScrollView`.
- Header: `Media Upload`.
- `UploadSummary`.
- `StatusBanner` when there is a permission, validation, success, or upload error message.
- `UploadIntake`.
- `UploadQueue` for active and completed tasks.

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm --workspace @media-upload/mobile run typecheck
```

Expected: PASS.

### Task 7: Add Mobile Persistence And App Resume Behavior

**Files:**
- Create: `apps/mobile/src/storage/mobileUploadDrafts.ts`
- Modify: `apps/mobile/src/hooks/useUploadManager.ts`
- Modify: `apps/mobile/src/screens/UploadScreen.tsx`

- [ ] **Step 1: Add draft persistence model**

Create `mobileUploadDrafts.ts` with serializable fields:

```ts
export type MobileUploadDraft = {
  localId: string;
  uploadId?: string;
  file: {
    name: string;
    size: number;
    type: string;
    uri?: string;
    previewUri?: string;
    checksum?: string;
  };
  status: "queued" | "paused" | "failed";
  uploadedChunkIndexes: number[];
  createdAt: string;
  updatedAt: string;
};
```

Include `serializeMobileUploadDrafts()` and `deserializeMobileUploadDrafts()` pure helpers with tests similar to history storage.

- [ ] **Step 2: Persist completed history**

In `useMobileUploadManager`, whenever `completedTasks` changes, merge and persist completed tasks using AsyncStorage and `mobileUploadHistoryKey`.

- [ ] **Step 3: Persist resumable drafts**

Persist tasks that are not completed/cancelled and contain `file.uri`. Store only serializable metadata; do not store blobs.

- [ ] **Step 4: Add app-state resume**

In `UploadScreen`, listen to `AppState`. When app becomes `active`, show an info banner: `Ready to resume incomplete uploads`. Do not automatically restart uploads unless source slicing can be recreated from `file.uri`.

- [ ] **Step 5: Document limitation in code comment**

Add one concise comment near app-state handling:

```ts
// Expo cannot guarantee OS-level background transfer here; we persist drafts and resume when the app is active again.
```

- [ ] **Step 6: Run mobile tests and typecheck**

Run:

```bash
npm --workspace @media-upload/mobile test
npm --workspace @media-upload/mobile run typecheck
```

Expected: PASS.

### Task 8: Add Mobile Screen Tests

**Files:**
- Create: `apps/mobile/src/screens/UploadScreen.test.tsx`
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Add a test script for component tests if needed**

If Node test runner cannot render React Native components cleanly, add:

```json
{
  "scripts": {
    "test:unit": "tsx --test src/**/*.test.ts",
    "test:components": "jest"
  }
}
```

Only add Jest config if `@testing-library/react-native` requires it in this Expo setup.

- [ ] **Step 2: Test permission denial**

Mock `expo-image-picker` so `requestMediaLibraryPermissionsAsync()` returns `{ granted: false }`. Render `UploadScreen`, press `Choose media`, and assert that the permission banner is visible.

- [ ] **Step 3: Test picker success**

Mock `launchImageLibraryAsync()` with two assets. Mock `fetch(uri).blob()` to return valid image/video blobs. Assert that two task cards render.

- [ ] **Step 4: Test controls**

Mock upload manager methods or API client so tasks stay in predictable states. Assert that pause, resume, and cancel controls call the expected action wrappers.

- [ ] **Step 5: Run component tests**

Run:

```bash
npm --workspace @media-upload/mobile test
```

Expected: PASS.

### Task 9: Update Documentation For Submission

**Files:**
- Modify: `README.md`
- Modify: `docs/setup.md`
- Modify: `docs/architecture.md`
- Modify: `docs/testing.md`

- [ ] **Step 1: Update README project status**

Add a short status block:

```md
## Assignment Coverage

- Web frontend: implemented React/Vite upload console with drag-and-drop, previews, progress, controls, and local history.
- Mobile frontend: implemented Expo app with library picker, camera capture, permissions, previews, upload queue, controls, and persisted history.
- Server APIs: implemented Symfony 6 chunked upload API with validation, reassembly, deduplication, cleanup, rate limiting, and Swagger docs.
- Tests: PHPUnit backend tests, shared upload-client unit tests, web history tests, and mobile upload helper/UI tests.
```

- [ ] **Step 2: Add mobile API base URL notes**

In `docs/setup.md`:

```md
## Mobile API URL

For iOS simulator:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api npm run dev:mobile
```

For Android emulator:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api npm run dev:mobile
```

For a physical device, use the computer's LAN IP:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000/api npm run dev:mobile
```
```

- [ ] **Step 3: Add background upload explanation**

In `docs/architecture.md`, add:

```md
## Mobile Background Behavior

The Expo MVP persists upload history and incomplete upload drafts locally. When the app returns to the foreground, the user can resume incomplete uploads through the same shared chunked upload manager. True OS-level background transfer on iOS/Android is a production extension that would require native background upload modules or a custom dev client.
```

- [ ] **Step 4: Add manual demo checklist**

In `docs/testing.md`, add:

```md
## Manual Mobile Demo Checklist

- Start backend with `npm run dev:backend:detached`.
- Start Expo with the correct `EXPO_PUBLIC_API_BASE_URL`.
- Deny media permission and confirm the app shows a clear permission message.
- Allow media permission and select 2-3 image/video files.
- Confirm validation rejects invalid type, too many files, or oversized files.
- Confirm each queued file shows preview, metadata, progress, and final completion.
- Pause and resume one active upload.
- Cancel one active upload.
- Capture media from camera and upload it.
- Restart the app and confirm completed history is still visible.
```

### Task 10: Final Verification

**Files:**
- No code changes unless verification finds issues.

- [ ] **Step 1: Run all TypeScript tests**

Run:

```bash
npm test
```

Expected: all workspace tests PASS.

- [ ] **Step 2: Run all type checks**

Run:

```bash
npm run typecheck
```

Expected: all workspace type checks PASS.

- [ ] **Step 3: Run backend test suite**

Run:

```bash
npm run test:backend
```

Expected: PHPUnit suite PASS.

- [ ] **Step 4: Start backend and mobile app**

Run:

```bash
npm run dev:backend:detached
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api npm run dev:mobile
```

Expected: Symfony API serves at `http://localhost:8000/api`, Expo starts without bundling errors.

- [ ] **Step 5: Perform manual demo checklist**

Use the checklist in `docs/testing.md`. Record any known limitations in `docs/tradeoffs.md`.

## Acceptance Criteria

- Mobile app looks intentionally designed, not like a scaffold.
- Mobile user can pick 1-10 image/video files and queue them.
- Mobile user can capture media from camera and queue it.
- Mobile app validates quantity, type, and file size before upload.
- Each mobile upload shows preview, metadata, progress, status, and error message when relevant.
- Mobile app exposes pause, resume, and cancel for active uploads.
- Uploads use `packages/upload-client` for chunking, concurrency, retry, API calls, and state transitions.
- Completed mobile history survives app restart.
- Documentation honestly explains background upload behavior and setup URLs.
- `npm test`, `npm run typecheck`, and `npm run test:backend` pass before submission.

## Review Notes

This plan intentionally avoids implementing native OS-level background upload during the MVP. For an assignment interview, the stronger choice is to deliver a polished, reliable Expo app with clear documented boundaries rather than adding brittle native background behavior late in the project.
