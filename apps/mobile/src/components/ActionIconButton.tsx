import { Pressable, StyleSheet, Text } from "react-native";
import { colors, spacing } from "../theme";

type Props = {
  label: string;
  tone?: "primary" | "neutral" | "danger";
  onPress: () => void;
};

export function ActionIconButton({ label, tone = "neutral", onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[tone], pressed && styles.pressed]}
    >
      <Text style={[styles.label, tone === "primary" && styles.primaryLabel, tone === "danger" && styles.dangerLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  neutral: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  danger: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca"
  },
  pressed: {
    opacity: 0.76
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  primaryLabel: {
    color: colors.surface
  },
  dangerLabel: {
    color: colors.danger
  }
});
