export type UploadIntakeProps = {
  onPickLibrary: () => Promise<void>;
  onCaptureCamera: () => Promise<void>;
  disabled?: boolean;
};

export type UploadIntakeActionButtonProps = {
  label: string;
  variant: "primary" | "secondary";
  disabled: boolean;
  onPress: () => Promise<void>;
};
