import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";
import { formatBytes } from "../../utils/format";
import { getStatusTone, humanizeStatus } from "../../utils/uploadStatus";
import type { UploadTaskMetaProps } from "./UploadTaskCard.types";
import { getTaskDetailsLabel } from "./UploadTaskCard.utils";

export const UploadTaskMeta = ({ task }: UploadTaskMetaProps) => {
  const tone = getStatusTone(task.status);
  const details = getTaskDetailsLabel({
    fileSizeLabel: formatBytes(task.file.size),
    fileType: task.file.type,
    totalChunks: task.totalChunks,
  });

  return (
    <View style={styles.meta}>
      <View style={styles.titleRow}>
        <Text numberOfLines={1} style={styles.name}>
          {task.file.name}
        </Text>
        <Text style={[styles.badge, styles[tone]]}>
          {humanizeStatus(task.status)}
        </Text>
      </View>
      <Text style={styles.details}>{details}</Text>
      {task.error ? (
        <Text style={styles.error}>{task.error.message}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  meta: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  details: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  badge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "800",
  },
  info: { color: colors.primary, backgroundColor: "#dbeafe" },
  success: { color: colors.success, backgroundColor: "#dcfce7" },
  warning: { color: colors.warning, backgroundColor: "#fef3c7" },
  danger: { color: colors.danger, backgroundColor: "#fee2e2" },
  muted: { color: colors.muted, backgroundColor: colors.surfaceMuted },
});
