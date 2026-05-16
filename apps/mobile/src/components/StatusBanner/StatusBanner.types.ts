export const StatusBannerTone = {
  Info: "info",
  Success: "success",
  Warning: "warning",
  Danger: "danger",
} as const;

export type StatusBannerTone =
  (typeof StatusBannerTone)[keyof typeof StatusBannerTone];

export type StatusBannerProps = {
  tone: StatusBannerTone;
  title: string;
  message: string;
};
