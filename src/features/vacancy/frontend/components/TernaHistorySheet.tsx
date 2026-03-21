"use client";

import { format, differenceInDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcn/sheet";
import { Badge } from "@shadcn/badge";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  UserMultiple02Icon,
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/core/lib/utils";
import { useTernaHistoryQuery } from "../hooks/useTernaHistoryQuery";
import type { TernaHistoryDTO } from "../types/vacancy.types";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";

interface TernaHistorySheetProps {
  open: boolean;
  onClose: () => void;
  vacancyId: string | null;
  vacancyPosition: string;
  /** Vacancy assignment date — used to calculate delivery days */
  vacancyAssignedAt?: string;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return fullName.slice(0, 2).toUpperCase();
}

function formatDateSafe(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd MMM yyyy 'a las' HH:mm", { locale: es });
  } catch {
    return "—";
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
  if (days === 0) return "El día exacto";
  if (days < 0)
    return `${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""} antes`;
  return `${days} día${days !== 1 ? "s" : ""} tarde`;
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
  if (days === 0) return "Entregada el día de asignación";
  if (days === 1) return "Entregada en 1 día";
  return `Entregada en ${days} días`;
}

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
    <div className="flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={cn(
            "size-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
            history.isOnTime
              ? "bg-green-100 text-green-700 ring-1 ring-green-300"
              : "bg-red-100 text-red-700 ring-1 ring-red-300",
          )}
        >
          #{history.ternaNumber}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-2 min-h-6" />}
      </div>

      {/* Card */}
      <div className="flex-1 pb-6">
        <div
          className={cn(
            "rounded-xl border p-4 space-y-4",
            "bg-gradient-to-b from-background to-muted/20",
            "hover:shadow-sm transition-shadow",
          )}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">
                  Terna #{history.ternaNumber}
                </span>
                <Badge
                  className={cn(
                    "text-xs gap-1",
                    history.isOnTime
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-red-100 text-red-700 border-red-200",
                  )}
                  variant="outline"
                >
                  <HugeiconsIcon
                    icon={
                      history.isOnTime ? CheckmarkCircle02Icon : Cancel01Icon
                    }
                    size={11}
                  />
                  {history.isOnTime ? "A tiempo" : "Fuera de tiempo"}
                </Badge>
              </div>

              {/* Date info */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <HugeiconsIcon icon={Calendar03Icon} size={12} />
                <span>{formatDateSafe(history.validatedAt)}</span>
              </div>

              {/* Delta */}
              {delta && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium",
                    history.isOnTime ? "text-green-600" : "text-red-500",
                  )}
                >
                  <HugeiconsIcon icon={Clock01Icon} size={12} />
                  <span>{delta}</span>
                  {history.targetDeliveryDate && (
                    <span className="text-muted-foreground font-normal">
                      · Objetivo:{" "}
                      {format(
                        new Date(history.targetDeliveryDate),
                        "dd MMM yyyy",
                        { locale: es },
                      )}
                    </span>
                  )}
                </div>
              )}

              {/* Delivery days */}
              {deliveryDays && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HugeiconsIcon icon={Calendar03Icon} size={12} />
                  <span>{deliveryDays}</span>
                </div>
              )}
            </div>

            {/* Validated by */}
            {history.validatedByName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <HugeiconsIcon icon={UserIcon} size={12} />
                <span>{history.validatedByName}</span>
              </div>
            )}
          </div>

          {/* Candidates */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
              <HugeiconsIcon icon={UserMultiple02Icon} size={12} />
              <span>
                {history.candidates.length} candidato
                {history.candidates.length !== 1 ? "s" : ""} en terna
              </span>
            </div>
            <div className="space-y-1.5">
              {history.candidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2"
                >
                  <div className="size-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {getInitials(c.candidateFullName)}
                  </div>
                  <span className="text-sm font-medium">
                    {c.candidateFullName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TernaSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="size-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

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
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-base">Historial de Ternas</SheetTitle>
          <p className="text-xs text-muted-foreground truncate">
            {vacancyPosition}
          </p>

          {/* Summary stats */}
          {histories.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {histories.length} terna{histories.length !== 1 ? "s" : ""} en
                total
              </Badge>
              {onTimeCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  {onTimeCount} a tiempo
                </Badge>
              )}
              {lateCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-red-50 text-red-700 border-red-200"
                >
                  {lateCount} fuera de tiempo
                </Badge>
              )}
            </div>
          )}
        </SheetHeader>

        {isLoading ? (
          <TernaSkeleton />
        ) : histories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 px-6">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <HugeiconsIcon
                icon={UserMultiple02Icon}
                size={22}
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm font-medium">Sin ternas registradas</p>
            <p className="text-xs text-center max-w-xs">
              Cuando se valide una terna, quedará registrada acá con fecha,
              validador y candidatos.
            </p>
          </div>
        ) : (
          <div className="px-6 pt-6 pb-4">
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
