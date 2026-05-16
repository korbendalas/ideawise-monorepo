import { StyleSheet, View } from "react-native";
import { spacing } from "../../theme";
import { QueueSection } from "../QueueSection";
import { UploadTaskCard } from "../UploadTaskCard";
import type { UploadQueueProps } from "./UploadQueue.types";

export const UploadQueue = ({
  activeTasks,
  completedTasks,
  onPause,
  onResume,
  onCancel,
}: UploadQueueProps) => (
  <View style={styles.stack}>
    <QueueSection title="Active uploads" emptyLabel="No active uploads yet.">
      {activeTasks.map((task) => (
        <UploadTaskCard
          key={task.localId}
          task={task}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
        />
      ))}
    </QueueSection>
    <QueueSection
      title="Completed"
      emptyLabel="Completed uploads will appear here."
    >
      {completedTasks.map((task) => (
        <UploadTaskCard
          key={task.localId}
          task={task}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
        />
      ))}
    </QueueSection>
  </View>
);

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
});
