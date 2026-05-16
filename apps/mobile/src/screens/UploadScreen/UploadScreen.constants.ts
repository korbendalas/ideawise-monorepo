import { StatusBannerTone } from "../../components/StatusBanner";
import type { BannerState } from "../../types/upload";

export const INITIAL_BANNER: BannerState = {
  tone: StatusBannerTone.Info,
  title: "Ready",
  message: "Select images or videos, or capture new media with the camera.",
};
