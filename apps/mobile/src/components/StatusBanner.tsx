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
  warning: { borderColor: "#fde68a", backgroundColor: "#fffbeb" },
  danger: { borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
  title: { color: colors.text, fontSize: 14, fontWeight: "800" },
  message: { color: colors.muted, fontSize: 13, lineHeight: 18 }
});
