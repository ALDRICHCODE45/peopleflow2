import { sileo } from "sileo";
import {
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Alert02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type ToastType = "info" | "warning" | "success" | "error";

export type ShowToastOptions = {
  type: ToastType;
  title: string;
  description: string;
  duration?: number;
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />,
  info: <HugeiconsIcon icon={InformationCircleIcon} className="size-3.5" />,
  warning: <HugeiconsIcon icon={Alert02Icon} className="size-3.5" />,
  error: <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />,
};

export function showToast({
  type,
  title,
  description,
  duration = 4000,
}: ShowToastOptions) {
  return sileo[type]({
    title,
    description,
    duration,
    icon: icons[type],
  });
}
