import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../theme";
import type { UploadIntakeActionButtonProps } from "./UploadIntake.types";

export const UploadIntakeActionButton = ({
  label,
  variant,
  disabled,
  onPress,
}: UploadIntakeActionButtonProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.action,
      styles[variant],
      pressed && styles.pressed,
      disabled && styles.disabled,
    ]}
  >
    <Text
      style={[
        styles.label,
        variant === "primary" ? styles.primaryLabel : styles.secondaryLabel,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  action: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
  },
  primaryLabel: {
    color: colors.surface,
  },
  secondaryLabel: {
    color: colors.text,
  },
});
