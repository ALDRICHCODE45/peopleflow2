"use client";

import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { useLeadStatusHistory } from "../../hooks/useLeadStatusHistory";
import type { LeadStatusHistoryItem, LeadStatus } from "../../types";
import { LEAD_STATUS_LABELS } from "../../types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  TimeQuarterPassIcon,
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

interface LeadStatusHistoryTimelineProps {
  leadId: string;
}

export function LeadStatusHistoryTimeline({
  leadId,
}: LeadStatusHistoryTimelineProps) {
  const { data: history = [], isLoading } = useLeadStatusHistory(leadId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Cargando historial...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <HugeiconsIcon
          icon={TimeQuarterPassIcon}
          className="h-12 w-12 mx-auto mb-2 opacity-50"
        />
        <p>No hay cambios de estado registrados</p>
        <p className="text-sm">
          El historial aparecerá cuando se modifique el estado del lead
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">
        {history.length} {history.length === 1 ? "cambio" : "cambios"} de estado
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {history.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ item }: { item: LeadStatusHistoryItem }) {
  return (
    <div className="relative pl-10">
      {/* Timeline dot */}
      <div className="absolute left-2 top-3 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="h-2.5 w-2.5 text-primary"
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            {/* Date */}
            <span className="text-xs text-muted-foreground">
              {format(new Date(item.createdAt), "PPP 'a las' p", {
                locale: es,
              })}
            </span>

            {/* Status change */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                className={`${STATUS_COLORS[item.previousStatus]} font-medium rounded-full text-xs px-2 py-0.5`}
              >
                {LEAD_STATUS_LABELS[item.previousStatus]}
              </Badge>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="h-4 w-4 text-muted-foreground"
              />
              <Badge
                className={`${STATUS_COLORS[item.newStatus]} font-medium rounded-full text-xs px-2 py-0.5`}
              >
                {LEAD_STATUS_LABELS[item.newStatus]}
              </Badge>
            </div>

            {/* Changed by */}
            {item.changedByName && (
              <p className="text-xs text-muted-foreground pt-1 border-t">
                Modificado por {item.changedByName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
