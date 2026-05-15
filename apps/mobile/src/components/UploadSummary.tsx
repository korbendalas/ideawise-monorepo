import type { MobileUploadSummary } from "../hooks/useUploadManager";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";
import { formatBytes } from "./uploadPresentation";

type Props = {
  summary: MobileUploadSummary;
};

export function UploadSummary({ summary }: Props) {
  return (
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
        <Metric label="Queued" value={summary.queued} />
        <Metric label="Active" value={summary.active} />
        <Metric label="Done" value={summary.completed} />
        <Metric label="Failed" value={summary.failed} />
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  value: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800"
  },
  bytes: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  track: {
    height: 9,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.sm
  },
  metric: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm
  },
  metricValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  }
});
