import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";
import { ActionIconButton } from "./ActionIconButton";
import { formatBytes, getAvailableActions, getStatusTone, humanizeStatus } from "./uploadPresentation";

type Props = {
  task: UploadTaskSnapshot;
  onPause: (localId: string) => void;
  onResume: (localId: string) => void;
  onCancel: (localId: string) => void;
};

export function UploadTaskCard({ task, onPause, onResume, onCancel }: Props) {
  const actions = getAvailableActions(task.status);
  const tone = getStatusTone(task.status);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.preview}>
          {task.file.previewUri ? (
            <Image source={{ uri: task.file.previewUri }} style={styles.previewImage} />
          ) : (
            <Text style={styles.previewFallback}>{task.file.type.startsWith("video/") ? "VID" : "IMG"}</Text>
          )}
        </View>
        <View style={styles.meta}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.name}>
              {task.file.name}
            </Text>
            <Text style={[styles.badge, styles[tone]]}>{humanizeStatus(task.status)}</Text>
          </View>
          <Text style={styles.details}>
            {formatBytes(task.file.size)} / {task.file.type || "unknown"} / {task.totalChunks} chunks
          </Text>
          {task.error ? <Text style={styles.error}>{task.error.message}</Text> : null}
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${task.progress.percentage}%` }]} />
        </View>
        <Text style={styles.percent}>{task.progress.percentage}%</Text>
      </View>

      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.includes("pause") ? <ActionIconButton label="Pause" onPress={() => onPause(task.localId)} /> : null}
          {actions.includes("resume") ? (
            <ActionIconButton label="Resume" tone="primary" onPress={() => onResume(task.localId)} />
          ) : null}
          {actions.includes("cancel") ? (
            <ActionIconButton label="Cancel" tone="danger" onPress={() => onCancel(task.localId)} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md
  },
  row: {
    flexDirection: "row",
    gap: spacing.md
  },
  preview: {
    width: 64,
    height: 64,
    overflow: "hidden",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted
  },
  previewImage: {
    width: "100%",
    height: "100%"
  },
  previewFallback: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  details: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17
  },
  badge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "800"
  },
  info: { color: colors.primary, backgroundColor: "#dbeafe" },
  success: { color: colors.success, backgroundColor: "#dcfce7" },
  warning: { color: colors.warning, backgroundColor: "#fef3c7" },
  danger: { color: colors.danger, backgroundColor: "#fee2e2" },
  muted: { color: colors.muted, backgroundColor: colors.surfaceMuted },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  track: {
    flex: 1,
    height: 8,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary
  },
  percent: {
    width: 42,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
