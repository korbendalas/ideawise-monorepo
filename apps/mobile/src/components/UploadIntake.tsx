import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

type Props = {
  onPickLibrary: () => Promise<void>;
  onCaptureCamera: () => Promise<void>;
  disabled?: boolean;
};

export function UploadIntake({ onPickLibrary, onCaptureCamera, disabled = false }: Props) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>Add media</Text>
        <Text style={styles.subtitle}>Images and videos, up to 10 files per batch.</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose media"
          disabled={disabled}
          onPress={onPickLibrary}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed, disabled && styles.disabled]}
        >
          <Text style={styles.primaryLabel}>Choose media</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Use camera"
          disabled={disabled}
          onPress={onCaptureCamera}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed, disabled && styles.disabled]}
        >
          <Text style={styles.secondaryLabel}>Use camera</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  primaryAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  secondaryAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  primaryLabel: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "800"
  },
  secondaryLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.76
  },
  disabled: {
    opacity: 0.5
  }
});
