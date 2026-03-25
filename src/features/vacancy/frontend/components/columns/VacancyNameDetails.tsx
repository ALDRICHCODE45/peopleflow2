"use client";

import type { Row } from "@tanstack/react-table";
import type { VacancyDTO } from "../../types/vacancy.types";
import { Badge } from "@shadcn/badge";

interface VacancyNameDetailsProps {
  row: Row<VacancyDTO>;
  onViewDetail?: (id: string) => void;
}

export function VacancyNameDetails({
  row,
  onViewDetail,
}: VacancyNameDetailsProps) {
  const vacancy = row.original;

  return (
    <div
      onClick={() => onViewDetail?.(vacancy.id)}
      className="flex flex-col min-w-0 overflow-hidden cursor-pointer group"
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate font-medium group-hover:text-primary transition-colors group-hover:underline underline-offset-4 decoration-primary/50">
          {vacancy.position || "Sin posición"}
        </span>
        {vacancy.isWarranty && (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 text-[10px] px-1.5 py-0 shrink-0">
            Garantía
          </Badge>
        )}
      </div>
      {vacancy.clientName && (
        <span className="text-xs text-muted-foreground truncate">
          {vacancy.clientName}
        </span>
      )}
    </div>
  );
}
