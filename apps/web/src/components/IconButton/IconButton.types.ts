import type React from "react";

export interface IconButtonProps {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}
