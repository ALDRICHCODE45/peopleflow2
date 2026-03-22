"use client";

import { format, differenceInDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/shared/ui/shadcn/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  UserMultiple02Icon,
  Calendar03Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/core/lib/utils";
import { useTernaHistoryQuery } from "../hooks/useTernaHistoryQuery";
import type { TernaHistoryDTO } from "../types/vacancy.types";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";

/* ──────────────────────────────────────────────
 * Props
 * ────────────────────────────────────────────── */

interface TernaHistorySheetProps {
  open: boolean;
  onClose: () => void;
  vacancyId: string | null;
  vacancyPosition: string;
  /** Vacancy assignment date — used to calculate delivery days */
  vacancyAssignedAt?: string;
}

/* ──────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────── */

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return fullName.slice(0, 2).toUpperCase();
}

function formatDateSafe(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

function formatTimeSafe(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return format(new Date(iso), "HH:mm", { locale: es });
  } catch {
    return "";
  }
}

function getDeltaLabel(
  validatedAt: string,
  targetDeliveryDate: string | null,
): string | null {
  if (!targetDeliveryDate) return null;
  const validated = new Date(validatedAt);
  const target = new Date(targetDeliveryDate);
  const days = differenceInDays(validated, target);
  if (days === 0) return "Puntual";
  if (days < 0)
    return `${Math.abs(days)}d antes`;
  return `${days}d tarde`;
}

function getDeliveryDaysLabel(
  validatedAt: string,
  assignedAt: string | undefined,
): string | null {
  if (!assignedAt) return null;
  const days = Math.max(
    0,
    differenceInDays(
      startOfDay(new Date(validatedAt)),
      startOfDay(new Date(assignedAt)),
    ),
  );
  if (days === 0) return "Mismo día";
  return `${days}d`;
}

/* ──────────────────────────────────────────────
 * TernaCard — single timeline entry
 * ────────────────────────────────────────────── */

function TernaCard({
  history,
  isLast,
  assignedAt,
}: {
  history: TernaHistoryDTO;
  isLast: boolean;
  assignedAt?: string;
}) {
  const delta = getDeltaLabel(history.validatedAt, history.targetDeliveryDate);
  const deliveryDays = getDeliveryDaysLabel(history.validatedAt, assignedAt);

  return (
    <div className="flex gap-3">
      {/* ── Timeline connector ── */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        {/* Numbered circle — subtle, small */}
        <div
          className={cn(
            "size-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
            "bg-muted text-muted-foreground ring-1 ring-border",
          )}
        >
          {history.ternaNumber}
        </div>
        {/* Vertical line */}
        {!isLast && <div className="w-px flex-1 bg-border mt-1.5 min-h-4" />}
      </div>

      {/* ── Card content ── */}
      <div className={cn("flex-1 min-w-0", !isLast ? "pb-5" : "pb-1")}>
        <div className="rounded-lg border border-border bg-background p-3 space-y-2.5">
          {/* Row 1: Primary — status + date */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-foreground">
                Terna #{history.ternaNumber}
              </span>
              {/* On-time indicator — subtle icon + text */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  history.isOnTime
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              >
                <HugeiconsIcon
                  icon={
                    history.isOnTime ? CheckmarkCircle02Icon : AlertCircleIcon
                  }
                  size={12}
                  strokeWidth={2}
                />
                <span className="hidden sm:inline">
                  {history.isOnTime ? "A tiempo" : "Fuera de tiempo"}
                </span>
              </span>
            </div>

            {/* Delta + delivery days — compact pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              {delta && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "text-[11px] leading-none px-1.5 py-0.5 rounded-md font-medium",
                        history.isOnTime
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
                      )}
                    >
                      {delta}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {history.targetDeliveryDate
                      ? `Objetivo: ${formatDateSafe(history.targetDeliveryDate)}`
                      : "Sin fecha objetivo"}
                  </TooltipContent>
                </Tooltip>
              )}
              {deliveryDays && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[11px] leading-none px-1.5 py-0.5 rounded-md font-medium bg-muted text-muted-foreground">
                      {deliveryDays}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Tiempo desde asignación hasta entrega
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Row 2: Secondary — date + validator */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={Calendar03Icon} size={11} />
              <span>
                {formatDateSafe(history.validatedAt)}
                {formatTimeSafe(history.validatedAt) && (
                  <span className="text-muted-foreground/60">
                    {" "}
                    · {formatTimeSafe(history.validatedAt)}
                  </span>
                )}
              </span>
            </div>
            {history.validatedByName && (
              <span className="truncate max-w-[140px] text-muted-foreground/70">
                {history.validatedByName}
              </span>
            )}
          </div>

          {/* Row 3: Candidates */}
          {history.candidates.length > 0 && (
            <div className="pt-0.5">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70 mb-1.5">
                <HugeiconsIcon icon={UserMultiple02Icon} size={11} />
                <span>
                  {history.candidates.length} candidato
                  {history.candidates.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1">
                {history.candidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-muted/50"
                  >
                    <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-semibold shrink-0">
                      {getInitials(c.candidateFullName)}
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">
                      {c.candidateFullName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
 * Loading skeleton
 * ────────────────────────────────────────────── */

function TernaSkeleton() {
  return (
    <div className="space-y-4 px-5 pt-5">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-7 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
 * Main component
 * ────────────────────────────────────────────── */

export function TernaHistorySheet({
  open,
  onClose,
  vacancyId,
  vacancyPosition,
  vacancyAssignedAt,
}: TernaHistorySheetProps) {
  const { data: histories = [], isLoading } = useTernaHistoryQuery(vacancyId);
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  const onTimeCount = histories.filter((h) => h.isOnTime).length;
  const lateCount = histories.filter((h) => !h.isOnTime).length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={sheetSide}
        width="lg"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <SheetTitle className="text-base font-semibold">
            Historial de Ternas
          </SheetTitle>
          <SheetDescription className="truncate">
            {vacancyPosition}
          </SheetDescription>

          {/* Summary — single muted line */}
          {histories.length > 0 && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              {histories.length} terna{histories.length !== 1 ? "s" : ""}
              {onTimeCount > 0 && (
                <span>
                  {" · "}
                  <span className="text-muted-foreground">
                    {onTimeCount} a tiempo
                  </span>
                </span>
              )}
              {lateCount > 0 && (
                <span>
                  {" · "}
                  <span className="text-muted-foreground">
                    {lateCount} fuera de tiempo
                  </span>
                </span>
              )}
            </p>
          )}
        </SheetHeader>

        {/* ── Body ── */}
        {isLoading ? (
          <TernaSkeleton />
        ) : histories.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2 px-6">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <HugeiconsIcon
                icon={Clock01Icon}
                size={18}
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm font-medium mt-1">Sin ternas registradas</p>
            <p className="text-xs text-center max-w-[220px] text-muted-foreground/70">
              Las ternas validadas aparecerán aquí con su fecha, validador y
              candidatos.
            </p>
          </div>
        ) : (
          /* Timeline */
          <div className="px-5 pt-5 pb-4">
            {histories.map((history, index) => (
              <TernaCard
                key={history.id}
                history={history}
                isLast={index === histories.length - 1}
                assignedAt={vacancyAssignedAt}
              />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
