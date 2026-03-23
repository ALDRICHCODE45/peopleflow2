"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserSwitchIcon,
  Alert02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";
import { useRecruiterAssignmentHistory } from "../hooks/useRecruiterAssignmentHistory";
import {
  REASSIGNMENT_REASON_LABELS,
  VACANCY_STATUS_LABELS,
  type ReassignmentReasonType,
  type VacancyStatusType,
} from "../types/vacancy.types";

interface RecruiterAssignmentTimelineProps {
  vacancyId: string;
}

function formatDate(isoString: string): string {
  try {
    return format(new Date(isoString), "dd MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="w-px flex-1 mt-1" />
          </div>
          <div className="flex-1 pb-3 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecruiterAssignmentTimeline({
  vacancyId,
}: RecruiterAssignmentTimelineProps) {
  const { data: history, isLoading } =
    useRecruiterAssignmentHistory(vacancyId);

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
        <HugeiconsIcon icon={UserSwitchIcon} size={28} strokeWidth={1.5} />
        <p className="text-sm">No hay historial de asignaciones</p>
      </div>
    );
  }

  // Sort oldest first for timeline
  const sorted = [...history].sort(
    (a, b) => new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime(),
  );

  return (
    <div className="relative mt-1">
      {sorted.map((entry, idx) => {
        const isCurrent = entry.unassignedAt === null;
        const isFirst = idx === 0;
        const isLast = idx === sorted.length - 1;

        return (
          <div key={entry.id} className="flex gap-3 relative">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div
                className={`mt-1 shrink-0 rounded-full border-2 ${
                  isCurrent
                    ? "size-3 border-emerald-500 bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                    : "size-2.5 border-border bg-muted"
                }`}
              />
              {/* Vertical line */}
              {!isLast && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-5 min-w-0">
              {/* Header: Recruiter name + current badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-sm font-semibold ${
                    isCurrent ? "text-foreground" : "text-foreground/80"
                  }`}
                >
                  {entry.recruiterName}
                </span>
                {isCurrent && (
                  <Badge variant="success" className="text-[10px] h-4 px-1.5">
                    Activo
                  </Badge>
                )}
              </div>

              {/* Role label */}
              <div className="text-xs text-muted-foreground mt-0.5">
                {isFirst && !entry.reason
                  ? "Asignación inicial"
                  : entry.reason
                    ? REASSIGNMENT_REASON_LABELS[entry.reason as ReassignmentReasonType]
                    : "Reasignación"}
              </div>

              {/* Metadata row */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {/* Date assigned */}
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.assignedAt)}
                  {entry.unassignedAt && ` → ${formatDate(entry.unassignedAt)}`}
                </span>

                {/* Duration — HERO metric */}
                {entry.durationDays != null && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-muted/70 rounded-md px-1.5 py-0.5">
                    <HugeiconsIcon
                      icon={Clock01Icon}
                      size={11}
                      className="text-muted-foreground"
                    />
                    {entry.durationDays} día{entry.durationDays !== 1 ? "s" : ""}
                  </span>
                )}

                {/* Status on entry */}
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {VACANCY_STATUS_LABELS[entry.vacancyStatusOnEntry as VacancyStatusType]}
                </Badge>
              </div>

              {/* Overdue warning */}
              {entry.wasOverdue && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <HugeiconsIcon icon={Alert02Icon} size={12} />
                  <span>Recibida con atraso</span>
                </div>
              )}

              {/* Notes */}
              {entry.notes && (
                <p className="text-xs text-foreground/60 mt-1.5 bg-muted/40 rounded px-2 py-1 leading-relaxed">
                  {entry.notes}
                </p>
              )}

              {/* Assigned by */}
              <div className="text-[11px] text-muted-foreground/70 mt-1">
                Asignado por {entry.assignedByName}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
