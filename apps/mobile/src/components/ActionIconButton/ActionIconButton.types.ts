export const ActionButtonTone = {
  Primary: "primary",
  Neutral: "neutral",
  Danger: "danger",
} as const;

export type ActionButtonTone =
  (typeof ActionButtonTone)[keyof typeof ActionButtonTone];

export type ActionIconButtonProps = {
  label: string;
  tone?: ActionButtonTone;
  onPress: () => void;
};
