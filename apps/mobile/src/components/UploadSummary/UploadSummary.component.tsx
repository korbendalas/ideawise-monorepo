import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";
import { formatBytes } from "../../utils/format";
import { SummaryMetric } from "../SummaryMetric";
import type { UploadSummaryProps } from "./UploadSummary.types";

export const UploadSummary = ({ summary }: UploadSummaryProps) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View>
        <Text style={styles.label}>Overall progress</Text>
        <Text style={styles.value}>{summary.percentage}%</Text>
      </View>
      <Text style={styles.bytes}>
        {formatBytes(summary.uploadedBytes)} / {formatBytes(summary.totalBytes)}
      </Text>
    </View>
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${summary.percentage}%` }]} />
    </View>
    <View style={styles.metrics}>
      <SummaryMetric label="Queued" value={summary.queued} />
      <SummaryMetric label="Active" value={summary.active} />
      <SummaryMetric label="Done" value={summary.completed} />
      <SummaryMetric label="Failed" value={summary.failed} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  bytes: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  track: {
    height: 9,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
