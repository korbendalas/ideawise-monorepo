import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";
import type { QueueSectionProps } from "./QueueSection.types";

export const QueueSection = ({
  title,
  emptyLabel,
  children,
}: QueueSectionProps) => {
  const items = Array.isArray(children)
    ? children.filter(Boolean)
    : children
      ? [children]
      : [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length > 0 ? (
        children
      ) : (
        <Text style={styles.empty}>{emptyLabel}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  empty: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    padding: spacing.lg,
  },
});
