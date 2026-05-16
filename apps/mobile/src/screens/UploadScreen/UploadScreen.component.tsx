import { useEffect, useState } from "react";
import { AppState, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBanner } from "../../components/StatusBanner";
import { UploadIntake } from "../../components/UploadIntake";
import { UploadQueue } from "../../components/UploadQueue";
import { UploadSummary } from "../../components/UploadSummary";
import { useMediaPicker } from "../../hooks/useMediaPicker";
import { useMobileUploadManager } from "../../hooks/useUploadManager";
import { colors, spacing } from "../../theme";
import type { BannerState } from "../../types/upload";
import { INITIAL_BANNER } from "./UploadScreen.constants";
import { UploadScreenHeader } from "./UploadScreenHeader.component";
import {
  getFailedTaskBanner,
  getResumeAvailableBanner,
} from "./UploadScreen.utils";

export const UploadScreen = () => {
  const uploadManager = useMobileUploadManager();
  const [banner, setBanner] = useState<BannerState>(INITIAL_BANNER);

  const { selectMedia, captureMedia, isPreparing } = useMediaPicker({
    onFilesReady: uploadManager.queueFiles,
    onBanner: setBanner,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && uploadManager.draftCount > 0) {
        setBanner(getResumeAvailableBanner(uploadManager.draftCount));
      }
    });

    return () => subscription.remove();
  }, [uploadManager.draftCount]);

  useEffect(() => {
    const failedTaskBanner = getFailedTaskBanner(uploadManager.tasks);
    if (failedTaskBanner) setBanner(failedTaskBanner);
  }, [uploadManager.tasks]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <UploadScreenHeader />
        <UploadSummary summary={uploadManager.summary} />
        <StatusBanner
          tone={banner.tone}
          title={banner.title}
          message={banner.message}
        />
        <UploadIntake
          onPickLibrary={selectMedia}
          onCaptureCamera={captureMedia}
          disabled={isPreparing}
        />
        <UploadQueue
          activeTasks={uploadManager.activeTasks}
          completedTasks={uploadManager.completedHistory}
          onPause={uploadManager.pause}
          onResume={uploadManager.resume}
          onCancel={(localId) => void uploadManager.cancel(localId)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
    gap: spacing.lg,
  },
});
