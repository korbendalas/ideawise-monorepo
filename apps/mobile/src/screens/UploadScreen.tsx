import { validateFiles } from "@media-upload/upload-client";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { AppState, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBanner, type StatusBannerTone } from "../components/StatusBanner";
import { UploadIntake } from "../components/UploadIntake";
import { UploadQueue } from "../components/UploadQueue";
import { UploadSummary } from "../components/UploadSummary";
import { mobileUploadConfig } from "../config/uploadConfig";
import { useMobileUploadManager } from "../hooks/useUploadManager";
import { colors, spacing } from "../theme";
import { createUploadSourceFromPickerAsset } from "./uploadSource";

type BannerState = {
  tone: StatusBannerTone;
  title: string;
  message: string;
};

export function UploadScreen() {
  const uploadManager = useMobileUploadManager();
  const [banner, setBanner] = useState<BannerState>({
    tone: "info",
    title: "Ready",
    message: "Select images or videos, or capture new media with the camera."
  });
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && uploadManager.draftCount > 0) {
        // Expo cannot guarantee OS-level background transfer here; we persist drafts and resume when the app is active again.
        setBanner({
          tone: "info",
          title: "Resume available",
          message: `${uploadManager.draftCount} incomplete upload${uploadManager.draftCount === 1 ? "" : "s"} can be resumed from the queue.`
        });
      }
    });

    return () => subscription.remove();
  }, [uploadManager.draftCount]);

  useEffect(() => {
    const failedTask = uploadManager.tasks.find((task) => task.status === "failed" && task.error);
    if (!failedTask?.error) {
      return;
    }

    setBanner({
      tone: failedTask.error.retryable ? "warning" : "danger",
      title: failedTask.error.retryable ? "Upload interrupted" : "Upload failed",
      message: failedTask.error.message
    });
  }, [uploadManager.tasks]);

  async function selectMedia() {
    setBanner({ tone: "info", title: "Opening library", message: "Choose up to 10 images or videos." });

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setBanner({
        tone: "warning",
        title: "Media permission needed",
        message: "Allow gallery access so selected images and videos can be prepared for upload."
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: mobileUploadConfig.maxFilesPerBatch,
      quality: 1
    });

    if (result.canceled || result.assets.length === 0) {
      setBanner({ tone: "info", title: "Selection cancelled", message: "No files were added to the queue." });
      return;
    }

    await queueAssets(result.assets);
  }

  async function captureMedia() {
    setBanner({ tone: "info", title: "Opening camera", message: "Capture an image or video to upload." });

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setBanner({
        tone: "warning",
        title: "Camera permission needed",
        message: "Allow camera access to capture media directly into the upload queue."
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1
    });

    if (result.canceled || result.assets.length === 0) {
      setBanner({ tone: "info", title: "Capture cancelled", message: "No camera media was added to the queue." });
      return;
    }

    await queueAssets([result.assets[0]]);
  }

  async function queueAssets(assets: ImagePicker.ImagePickerAsset[]) {
    setIsPreparing(true);

    try {
      const sources = await Promise.all(assets.map(createUploadSourceFromPickerAsset));
      const errors = validateFiles(sources, { maxFileSizeBytes: mobileUploadConfig.maxFileSizeBytes });

      if (errors.length > 0) {
        setBanner({
          tone: "danger",
          title: "Validation failed",
          message: errors.map((error) => error.message).join(" ")
        });
        return;
      }

      uploadManager.queueFiles(sources);
      setBanner({
        tone: "success",
        title: "Upload queued",
        message: `${sources.length} file${sources.length === 1 ? "" : "s"} added to the transfer queue.`
      });
    } catch (error) {
      setBanner({
        tone: "danger",
        title: "Media preparation failed",
        message: error instanceof Error ? error.message : "Selected media could not be prepared for upload."
      });
    } finally {
      setIsPreparing(false);
    }
  }

  function cancelUpload(localId: string) {
    void uploadManager.cancel(localId);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Chunked transfer console</Text>
          <Text style={styles.title}>Media Upload</Text>
          <Text style={styles.subtitle}>Pick, capture, pause, resume, and track image or video uploads.</Text>
        </View>
        <UploadSummary summary={uploadManager.summary} />
        <StatusBanner tone={banner.tone} title={banner.title} message={banner.message} />
        <UploadIntake onPickLibrary={selectMedia} onCaptureCamera={captureMedia} disabled={isPreparing} />
        <UploadQueue
          activeTasks={uploadManager.activeTasks}
          completedTasks={uploadManager.completedHistory}
          onPause={uploadManager.pause}
          onResume={uploadManager.resume}
          onCancel={cancelUpload}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
    gap: spacing.lg
  },
  header: {
    gap: spacing.xs,
    paddingTop: spacing.sm
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21
  }
});
