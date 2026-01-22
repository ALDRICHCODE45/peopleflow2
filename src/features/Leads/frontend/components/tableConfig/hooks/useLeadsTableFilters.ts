"use client";
import { Table } from "@tanstack/react-table";
import { useCallback, useState } from "react";

export const useLeadsTableFilters = (table: Table<unknown>) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [selectedSector, setSelectedSector] = useState<string>("todos");
  const [selectedOrigin, setSelectedOrigin] = useState<string>("todos");

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      setSelectedStatus(newStatus);

      if (newStatus === "todos") {
        table.getColumn("status")?.setFilterValue(undefined);
        return;
      }

      table.getColumn("status")?.setFilterValue(newStatus);
      table.setPageIndex(0);
    },
    [table]
  );

  const handleSectorChange = useCallback(
    (newSector: string) => {
      setSelectedSector(newSector);

      if (newSector === "todos") {
        table.getColumn("sectorName")?.setFilterValue(undefined);
        return;
      }

      table.getColumn("sectorName")?.setFilterValue(newSector);
      table.setPageIndex(0);
    },
    [table]
  );

  const handleOriginChange = useCallback(
    (newOrigin: string) => {
      setSelectedOrigin(newOrigin);

      if (newOrigin === "todos") {
        table.getColumn("originName")?.setFilterValue(undefined);
        return;
      }

      table.getColumn("originName")?.setFilterValue(newOrigin);
      table.setPageIndex(0);
    },
    [table]
  );

  const clearFilters = useCallback(() => {
    setSelectedStatus("todos");
    setSelectedSector("todos");
    setSelectedOrigin("todos");
    table.getColumn("status")?.setFilterValue(undefined);
    table.getColumn("sectorName")?.setFilterValue(undefined);
    table.getColumn("originName")?.setFilterValue(undefined);
  }, [table]);

  return {
    // constants
    selectedStatus,
    selectedSector,
    selectedOrigin,
    // methods
    handleStatusChange,
    handleSectorChange,
    handleOriginChange,
    clearFilters,
  };
};
