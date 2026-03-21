"use client";
import type { Table } from "@tanstack/react-table";
import { useCallback, useState } from "react";
import type { VacancyStatusType } from "../../../types/vacancy.types";

const VALID_STATUSES: Set<string> = new Set<VacancyStatusType>([
  "QUICK_MEETING",
  "HUNTING",
  "FOLLOW_UP",
  "PRE_PLACEMENT",
  "PLACEMENT",
  "STAND_BY",
  "CANCELADA",
  "PERDIDA",
]);

export const useVacanciesTableFilters = (table: Table<unknown>) => {
  const [selectedEstado, setSelectedEstado] = useState<string>("todos");

  const handleEstadoChange = useCallback(
    (newEstado: string) => {
      setSelectedEstado(newEstado);

      if (newEstado === "todos") {
        table.getColumn("status")?.setFilterValue(undefined);
        return;
      }

      if (VALID_STATUSES.has(newEstado)) {
        table.getColumn("status")?.setFilterValue(newEstado);
        table.setPageIndex(0);
      }
    },
    [table]
  );

  const clearFilters = useCallback(() => {
    setSelectedEstado("todos");
    table.getColumn("status")?.setFilterValue(undefined);
  }, [table]);

  return {
    //constants
    selectedEstado,
    //methods
    handleEstadoChange,
    clearFilters,
  };
};
