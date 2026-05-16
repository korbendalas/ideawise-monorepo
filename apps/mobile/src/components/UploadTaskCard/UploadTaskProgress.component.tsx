import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";
import type { UploadTaskProgressProps } from "./UploadTaskCard.types";

export const UploadTaskProgress = ({ percentage }: UploadTaskProgressProps) => (
  <View style={styles.progressRow}>
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${percentage}%` }]} />
    </View>
    <Text style={styles.percent}>{percentage}%</Text>
  </View>
);

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  track: {
    flex: 1,
    height: 8,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  percent: {
    width: 42,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
});
