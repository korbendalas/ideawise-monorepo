import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../../theme";
import { UploadTaskActions } from "./UploadTaskActions.component";
import { UploadTaskMeta } from "./UploadTaskMeta.component";
import { UploadTaskPreview } from "./UploadTaskPreview.component";
import { UploadTaskProgress } from "./UploadTaskProgress.component";
import type { UploadTaskCardProps } from "./UploadTaskCard.types";

export const UploadTaskCard = ({
  task,
  onPause,
  onResume,
  onCancel,
}: UploadTaskCardProps) => (
  <View style={styles.card}>
    <View style={styles.row}>
      <UploadTaskPreview
        previewUri={task.file.previewUri}
        fileType={task.file.type}
      />
      <UploadTaskMeta task={task} />
    </View>

    <UploadTaskProgress percentage={task.progress.percentage} />
    <UploadTaskActions
      localId={task.localId}
      status={task.status}
      onPause={onPause}
      onResume={onResume}
      onCancel={onCancel}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
});
