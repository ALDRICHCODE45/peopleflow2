"use client";

import { differenceInDays, startOfDay, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@lib/utils";
import type { VacancyStatusType } from "../types/vacancy.types";

// ── Constants ────────────────────────────────────────────────────────────────

const TERMINAL_STATUSES: ReadonlySet<VacancyStatusType> = new Set([
  "CANCELADA",
  "PERDIDA",
  "STAND_BY",
]);

const COMPLETED_STATUSES: ReadonlySet<VacancyStatusType> = new Set([
  "PLACEMENT",
]);

// ── Types ────────────────────────────────────────────────────────────────────

interface VacancyProgressIndicatorProps {
  /** Progress baseline — resets on rollback */
  currentCycleStartedAt: string;
  targetDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  status: string;
  variant?: "compact" | "expanded";
}

interface ProgressData {
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  progress: number;
  isDelivered: boolean;
  isTerminal: boolean;
  isCompleted: boolean;
  deliveryDelta: number | null;
}

type ProgressColor = "green" | "amber" | "red" | "darkRed" | "blue" | "muted";

// ── Calculation ──────────────────────────────────────────────────────────────

function calculateProgress(
  currentCycleStartedAt: string,
  targetDeliveryDate: string | null,
  actualDeliveryDate: string | null,
  status: string,
): ProgressData {
  const today = startOfDay(new Date());
  const start = startOfDay(parseISO(currentCycleStartedAt));
  const isDelivered = !!actualDeliveryDate;
  const isTerminal = TERMINAL_STATUSES.has(status as VacancyStatusType);
  const isCompleted = COMPLETED_STATUSES.has(status as VacancyStatusType);

  if (!targetDeliveryDate) {
    return {
      totalDays: 0,
      elapsedDays: differenceInDays(today, start),
      remainingDays: 0,
      progress: 0,
      isDelivered,
      isTerminal,
      isCompleted,
      deliveryDelta: null,
    };
  }

  const target = startOfDay(parseISO(targetDeliveryDate));
  const totalDays = Math.max(0, differenceInDays(target, start));
  const elapsedDays = Math.max(0, differenceInDays(today, start));
  const remainingDays = differenceInDays(target, today);
  const progress = totalDays > 0 ? Math.min(Math.max(elapsedDays / totalDays, 0), 1) : 1;

  let deliveryDelta: number | null = null;
  if (isDelivered && actualDeliveryDate) {
    const actual = startOfDay(parseISO(actualDeliveryDate));
    deliveryDelta = differenceInDays(actual, target);
  }

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    progress,
    isDelivered,
    isTerminal,
    isCompleted,
    deliveryDelta,
  };
}

// ── Color resolution ─────────────────────────────────────────────────────────

function resolveColor(data: ProgressData, targetDeliveryDate: string | null): ProgressColor {
  if (data.isTerminal) return "muted";
  if (data.isDelivered || data.isCompleted) return "blue";
  if (data.totalDays === 0 && !targetDeliveryDate) return "muted";
  if (data.remainingDays < 0) return "darkRed";

  const { totalDays, remainingDays } = data;
  if (totalDays <= 0) return "darkRed";

  const ratio = remainingDays / totalDays;
  if (ratio > 0.3) return "green";
  if (ratio > 0.1) return "amber";
  return "red";
}

const BAR_COLOR_CLASSES: Record<ProgressColor, string> = {
  green: "bg-green-500 dark:bg-green-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  red: "bg-red-500 dark:bg-red-400",
  darkRed: "bg-red-600 dark:bg-red-500",
  blue: "bg-primary",
  muted: "bg-muted-foreground/40",
};

const TEXT_COLOR_CLASSES: Record<ProgressColor, string> = {
  green: "text-green-700 dark:text-green-400",
  amber: "text-amber-700 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  darkRed: "text-red-700 dark:text-red-400",
  blue: "text-primary",
  muted: "text-muted-foreground",
};

const TRACK_COLOR_CLASSES: Record<ProgressColor, string> = {
  green: "bg-green-100 dark:bg-green-900/30",
  amber: "bg-amber-100 dark:bg-amber-900/30",
  red: "bg-red-100 dark:bg-red-900/30",
  darkRed: "bg-red-100 dark:bg-red-900/30",
  blue: "bg-primary/10",
  muted: "bg-muted",
};

// ── Label helpers ────────────────────────────────────────────────────────────

function formatCompactLabel(data: ProgressData, targetDeliveryDate: string | null): string {
  if (data.isTerminal) return "Inactiva";
  if (data.isDelivered) {
    if (data.deliveryDelta !== null && data.deliveryDelta > 0) {
      return `${data.deliveryDelta}d tarde`;
    }
    return "Entregada";
  }
  if (data.isCompleted) return "Placement";
  if (data.totalDays === 0 && !targetDeliveryDate) return "Sin fecha";
  if (data.totalDays === 0) return `${Math.abs(data.remainingDays)}d tarde`;
  if (data.remainingDays < 0) return `${Math.abs(data.remainingDays)}d tarde`;
  if (data.remainingDays === 0) return "Hoy";
  return `${data.elapsedDays}d`;
}

function formatExpandedSublabel(
  data: ProgressData,
  targetDeliveryDate: string | null,
  actualDeliveryDate: string | null,
): string {
  if (data.isTerminal) return "Vacante inactiva";
  if (data.isDelivered && actualDeliveryDate) {
    const actualFormatted = format(parseISO(actualDeliveryDate), "d MMM yyyy", { locale: es });
    if (data.deliveryDelta !== null) {
      if (data.deliveryDelta > 0) {
        return `Entregada el ${actualFormatted} · ${data.deliveryDelta} día${data.deliveryDelta !== 1 ? "s" : ""} tarde`;
      }
      if (data.deliveryDelta < 0) {
        const ahead = Math.abs(data.deliveryDelta);
        return `Entregada el ${actualFormatted} · ${ahead} día${ahead !== 1 ? "s" : ""} antes`;
      }
      return `Entregada el ${actualFormatted} · en tiempo`;
    }
    return `Entregada el ${actualFormatted}`;
  }
  if (data.isCompleted) return "Placement confirmado";
  if (data.totalDays === 0 && !targetDeliveryDate) return "Sin fecha máxima de entrega";
  if (data.remainingDays < 0) {
    const overdue = Math.abs(data.remainingDays);
    return `${data.elapsedDays}d transcurridos · ${overdue}d de atraso`;
  }
  return `${data.elapsedDays}d transcurridos · ${data.remainingDays}d restantes`;
}

// ── Compact variant ──────────────────────────────────────────────────────────

function CompactIndicator({
  data,
  color,
  targetDeliveryDate,
}: {
  data: ProgressData;
  color: ProgressColor;
  targetDeliveryDate: string | null;
}) {
  const label = formatCompactLabel(data, targetDeliveryDate);
  const hasBar = data.totalDays > 0 || data.remainingDays < 0 || data.isDelivered || data.isCompleted;
  const barProgress = data.isDelivered || data.isCompleted ? 1 : data.remainingDays < 0 ? 1 : data.progress;

  return (
    <div className="flex flex-col gap-1 min-w-[80px] max-w-[120px]">
      {hasBar && (
        <div className={cn("h-1.5 w-full rounded-full overflow-hidden", TRACK_COLOR_CLASSES[color])}>
          <div
            className={cn("h-full rounded-full", BAR_COLOR_CLASSES[color])}
            style={{ width: `${Math.round(barProgress * 100)}%` }}
          />
        </div>
      )}
      <span className={cn("text-xs font-medium leading-none", TEXT_COLOR_CLASSES[color])}>
        {label}
      </span>
    </div>
  );
}

// ── Expanded variant ─────────────────────────────────────────────────────────

function ExpandedIndicator({
  data,
  color,
  targetDeliveryDate,
  actualDeliveryDate,
}: {
  data: ProgressData;
  color: ProgressColor;
  targetDeliveryDate: string | null;
  actualDeliveryDate: string | null;
}) {
  const sublabel = formatExpandedSublabel(data, targetDeliveryDate, actualDeliveryDate);
  const hasBar = data.totalDays > 0 || data.remainingDays < 0 || data.isDelivered || data.isCompleted;
  const barProgress = data.isDelivered || data.isCompleted ? 1 : data.remainingDays < 0 ? 1 : data.progress;
  const percentage = Math.round(barProgress * 100);

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
            Progreso de entrega
          </h4>
          <span className={cn("text-xs truncate", TEXT_COLOR_CLASSES[color])}>
            {sublabel}
          </span>
        </div>
        {hasBar && (
          <span className={cn("text-xs font-semibold tabular-nums shrink-0", TEXT_COLOR_CLASSES[color])}>
            {percentage}%
          </span>
        )}
      </div>

      {hasBar && (
        <div className={cn("h-2 w-full rounded-full overflow-hidden", TRACK_COLOR_CLASSES[color])}>
          <div
            className={cn("h-full rounded-full", BAR_COLOR_CLASSES[color])}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ── Public component ─────────────────────────────────────────────────────────

export function VacancyProgressIndicator({
  currentCycleStartedAt,
  targetDeliveryDate,
  actualDeliveryDate,
  status,
  variant = "compact",
}: VacancyProgressIndicatorProps) {
  const data = calculateProgress(currentCycleStartedAt, targetDeliveryDate, actualDeliveryDate, status);
  const color = resolveColor(data, targetDeliveryDate);

  if (variant === "expanded") {
    return (
      <ExpandedIndicator
        data={data}
        color={color}
        targetDeliveryDate={targetDeliveryDate}
        actualDeliveryDate={actualDeliveryDate}
      />
    );
  }

  return <CompactIndicator data={data} color={color} targetDeliveryDate={targetDeliveryDate} />;
}
