import type { UploadTaskSnapshot } from "@media-upload/shared-types";
import type React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";
import { UploadTaskCard } from "./UploadTaskCard";

type Props = {
  activeTasks: UploadTaskSnapshot[];
  completedTasks: UploadTaskSnapshot[];
  onPause: (localId: string) => void;
  onResume: (localId: string) => void;
  onCancel: (localId: string) => void;
};

export function UploadQueue({ activeTasks, completedTasks, onPause, onResume, onCancel }: Props) {
  return (
    <View style={styles.stack}>
      <Section title="Active uploads" emptyLabel="No active uploads yet.">
        {activeTasks.map((task) => (
          <UploadTaskCard
            key={task.localId}
            task={task}
            onPause={onPause}
            onResume={onResume}
            onCancel={onCancel}
          />
        ))}
      </Section>
      <Section title="Completed" emptyLabel="Completed uploads will appear here.">
        {completedTasks.map((task) => (
          <UploadTaskCard
            key={task.localId}
            task={task}
            onPause={onPause}
            onResume={onResume}
            onCancel={onCancel}
          />
        ))}
      </Section>
    </View>
  );
}

function Section({ title, emptyLabel, children }: { title: string; emptyLabel: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length > 0 ? children : <Text style={styles.empty}>{emptyLabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  empty: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    padding: spacing.lg
  }
});
