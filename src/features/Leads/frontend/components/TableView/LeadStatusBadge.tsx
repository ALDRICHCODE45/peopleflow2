"use client";

import { Badge } from "@/core/shared/ui/shadcn/badge";
import type { LeadStatus } from "../../types";
import { LEAD_STATUS_LABELS } from "../../types";

const STATUS_COLORS: Record<LeadStatus, string> = {
  CONTACTO: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  CONTACTO_CALIDO:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  SOCIAL_SELLING:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  CITA_AGENDADA:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  CITA_ATENDIDA:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  CITA_VALIDADA:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  POSICIONES_ASIGNADAS:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  STAND_BY: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  return (
    <Badge
      className={`${STATUS_COLORS[status]} font-medium rounded-full inline-flex items-center gap-1.5 px-2.5 whitespace-nowrap`}
    >
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {LEAD_STATUS_LABELS[status]}
    </Badge>
  );
}
