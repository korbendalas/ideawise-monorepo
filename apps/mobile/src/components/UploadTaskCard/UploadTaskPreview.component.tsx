import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme";
import type { UploadTaskPreviewProps } from "./UploadTaskCard.types";
import { getPreviewFallbackLabel } from "./UploadTaskCard.utils";

export const UploadTaskPreview = ({
  previewUri,
  fileType,
}: UploadTaskPreviewProps) => (
  <View style={styles.preview}>
    {previewUri ? (
      <Image source={{ uri: previewUri }} style={styles.previewImage} />
    ) : (
      <Text style={styles.previewFallback}>
        {getPreviewFallbackLabel(fileType)}
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  preview: {
    width: 64,
    height: 64,
    overflow: "hidden",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewFallback: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
});
