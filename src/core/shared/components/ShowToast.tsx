import { toast } from "sonner";

type ToastType = "info" | "warning" | "success" | "error";

export type ShowToastOptions = {
  type: ToastType;
  title: string;
  description: string;
  onClose?: () => void;
  duration?: number;
};

export function showToast({
  type,
  title,
  description,
  onClose,
  duration = 4000,
}: ShowToastOptions) {
  const options = {
    description,
    duration,
    onAutoClose: onClose,
    onDismiss: onClose,
    style: {
      "--toast-duration": `${duration}ms`,
    } as React.CSSProperties,
  } as const;
  switch (type) {
    case "info":
      return toast.info(title, options);
    case "warning":
      return toast.warning(title, options);
    case "success":
      return toast.success(title, options);
    case "error":
      return toast.error(title, options);
    default:
      return toast(title, options);
  }
}
