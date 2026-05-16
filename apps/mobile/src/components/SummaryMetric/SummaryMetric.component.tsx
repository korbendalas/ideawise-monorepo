import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";
import type { SummaryMetricProps } from "./SummaryMetric.types";

export const SummaryMetric = ({ label, value }: SummaryMetricProps) => (
  <View style={styles.metric}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  metric: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
});
