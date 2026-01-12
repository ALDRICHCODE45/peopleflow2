"use client";
import { Table } from "@tanstack/react-table";
import { useCallback, useState } from "react";

export const useVacanciesTableFilters = (table: Table<unknown>) => {
  const [selectedEstado, setSelectedEstado] = useState<string>("todos");

  const handleEstadoChange = useCallback(
    (newEstado: string) => {
      setSelectedEstado(newEstado);

      if (newEstado === "todos") {
        table.getColumn("isActive")?.setFilterValue(undefined);
        return;
      }

      switch (newEstado) {
        case "DRAFT":
          table.getColumn("status")?.setFilterValue(newEstado);
          table.setPageIndex(0);
          break;
        case "OPEN":
          table.getColumn("status")?.setFilterValue(newEstado);
          table.setPageIndex(0);
          break;

        case "CLOSED":
          table.getColumn("status")?.setFilterValue(newEstado);
          table.setPageIndex(0);
          break;
        case "ARCHIVED":
          table.getColumn("status")?.setFilterValue(newEstado);
          table.setPageIndex(0);
          break;
        default:
          break;
      }
    },
    [table],
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
