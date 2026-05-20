"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Briefcase01Icon,
  CalendarBlock01Icon,
  ChartBarLineIcon,
  Exchange01Icon,
  FileRemoveIcon,
  HourglassIcon,
  SunCloud01Icon,
  Tick02Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import type { InAppNotificationType } from "../types/inAppNotification.types";

interface IconConfig {
  icon: typeof Tick02Icon;
  tone: "violet" | "red" | "blue" | "amber" | "slate" | "orange";
  label: string;
}

// Map each notification type to its visual identity.
// Tone drives both the icon color and the soft background tint of the circle.
const TYPE_CONFIG: Record<InAppNotificationType, IconConfig> = {
  VACANCY_ATTACHMENT_REJECTED: {
    icon: FileRemoveIcon,
    tone: "red",
    label: "Adjunto rechazado",
  },
  VACANCY_CHECKLIST_REJECTED: {
    icon: FileRemoveIcon,
    tone: "red",
    label: "Checklist rechazado",
  },
  TERNA_VALIDATION_PENDING: {
    icon: UserCheck01Icon,
    tone: "violet",
    label: "Validación pendiente",
  },
  VACANCY_ASSIGNED: {
    icon: Briefcase01Icon,
    tone: "blue",
    label: "Vacante asignada",
  },
  LEAD_STATUS_CHANGED: {
    icon: Exchange01Icon,
    tone: "amber",
    label: "Cambio de estado",
  },
  LEAD_INACTIVE: {
    icon: HourglassIcon,
    tone: "slate",
    label: "Lead inactivo",
  },
  VACANCY_STALE: {
    icon: AlertCircleIcon,
    tone: "orange",
    label: "Vacante estancada",
  },
  VACANCY_COUNTDOWN: {
    icon: CalendarBlock01Icon,
    tone: "orange",
    label: "Vacante por vencer",
  },
  COMMITMENT_MORNING_REMINDER: {
    icon: SunCloud01Icon,
    tone: "amber",
    label: "Recordatorio matutino",
  },
  COMMITMENT_EVENING_ADMIN_REPORT: {
    icon: ChartBarLineIcon,
    tone: "violet",
    label: "Reporte vespertino",
  },
};

// Tone tokens — light tint background + saturated icon foreground.
// Kept minimal so the system reads as "color is meaning", not decoration.
const TONE_CLASSES: Record<IconConfig["tone"], string> = {
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  red: "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  blue: "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
};

interface NotificationTypeIconProps {
  type: InAppNotificationType;
}

export function NotificationTypeIcon({ type }: NotificationTypeIconProps) {
  const config = TYPE_CONFIG[type];
  const toneClass = TONE_CLASSES[config.tone];

  return (
    <span
      role="img"
      aria-label={config.label}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${toneClass}`}
    >
      <HugeiconsIcon icon={config.icon} className="size-4" strokeWidth={2} />
    </span>
  );
}
