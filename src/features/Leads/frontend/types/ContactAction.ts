import { IconSvgElement } from "@hugeicons/react";

export interface ContactAction {
  id: string;
  label: string;
  variant?: "default" | "destructive";
  icon?: IconSvgElement;
  onClick: () => void;
}
