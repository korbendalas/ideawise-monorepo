import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";
import { UploadIntakeActionButton } from "./UploadIntakeActionButton.component";
import type { UploadIntakeProps } from "./UploadIntake.types";

export const UploadIntake = ({
  onPickLibrary,
  onCaptureCamera,
  disabled = false,
}: UploadIntakeProps) => (
  <View style={styles.card}>
    <View>
      <Text style={styles.title}>Add media</Text>
      <Text style={styles.subtitle}>
        Images and videos, up to 10 files per batch.
      </Text>
    </View>
    <View style={styles.actions}>
      <UploadIntakeActionButton
        label="Choose media"
        variant="primary"
        disabled={disabled}
        onPress={onPickLibrary}
      />
      <UploadIntakeActionButton
        label="Use camera"
        variant="secondary"
        disabled={disabled}
        onPress={onCaptureCamera}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
