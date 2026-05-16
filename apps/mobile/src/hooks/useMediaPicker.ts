import { validateFiles, type UploadSource } from "@media-upload/upload-client";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import type { BannerState } from "../types/upload";
import { StatusBannerTone } from "../components/StatusBanner";
import { mobileUploadConfig } from "../config/uploadConfig";
import { createUploadSourceFromPickerAsset } from "../utils/mediaSource";

export type UseMediaPickerOptions = {
  onFilesReady: (sources: UploadSource[]) => void;
  onBanner: (banner: BannerState) => void;
};

export type UseMediaPickerResult = {
  selectMedia: () => Promise<void>;
  captureMedia: () => Promise<void>;
  isPreparing: boolean;
};

export const useMediaPicker = ({
  onFilesReady,
  onBanner,
}: UseMediaPickerOptions): UseMediaPickerResult => {
  const [isPreparing, setIsPreparing] = useState(false);

  const queueAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setIsPreparing(true);

    try {
      const sources = await Promise.all(
        assets.map(createUploadSourceFromPickerAsset),
      );
      const errors = validateFiles(sources, {
        maxFileSizeBytes: mobileUploadConfig.maxFileSizeBytes,
      });

      if (errors.length > 0) {
        onBanner({
          tone: StatusBannerTone.Danger,
          title: "Validation failed",
          message: errors.map((e) => e.message).join(" "),
        });
        return;
      }

      onFilesReady(sources);
      onBanner({
        tone: StatusBannerTone.Success,
        title: "Upload queued",
        message: `${sources.length} file${sources.length === 1 ? "" : "s"} added to the transfer queue.`,
      });
    } catch (error) {
      onBanner({
        tone: StatusBannerTone.Danger,
        title: "Media preparation failed",
        message:
          error instanceof Error
            ? error.message
            : "Selected media could not be prepared for upload.",
      });
    } finally {
      setIsPreparing(false);
    }
  };

  const selectMedia = async () => {
    onBanner({
      tone: StatusBannerTone.Info,
      title: "Opening library",
      message: "Choose up to 10 images or videos.",
    });

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onBanner({
        tone: StatusBannerTone.Warning,
        title: "Media permission needed",
        message:
          "Allow gallery access so selected images and videos can be prepared for upload.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: mobileUploadConfig.maxFilesPerBatch,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      onBanner({
        tone: StatusBannerTone.Info,
        title: "Selection cancelled",
        message: "No files were added to the queue.",
      });
      return;
    }

    await queueAssets(result.assets);
  };

  const captureMedia = async () => {
    onBanner({
      tone: StatusBannerTone.Info,
      title: "Opening camera",
      message: "Capture an image or video to upload.",
    });

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      onBanner({
        tone: StatusBannerTone.Warning,
        title: "Camera permission needed",
        message:
          "Allow camera access to capture media directly into the upload queue.",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      onBanner({
        tone: StatusBannerTone.Info,
        title: "Capture cancelled",
        message: "No camera media was added to the queue.",
      });
      return;
    }

    await queueAssets([result.assets[0]]);
  };

  return { selectMedia, captureMedia, isPreparing };
};
