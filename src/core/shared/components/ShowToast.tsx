import { toast } from "sonner";

type ToastType = "info" | "warning" | "success" | "error";

export type ShowToastOptions = {
  type: ToastType;
  title: string;
  description: string;
  onClose?: () => void;
};

export function showToast({
  type,
  title,
  description,
  onClose,
}: ShowToastOptions) {
  const options = {
    description,
    onAutoClose: onClose,
    onDismiss: onClose,
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
