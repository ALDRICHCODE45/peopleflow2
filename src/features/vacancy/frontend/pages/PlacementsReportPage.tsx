"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";
import { showToast } from "@/core/shared/components/ShowToast";
import { usePlacementsReportQuery } from "../hooks/usePlacementsReportQuery";
import { PlacementsReportSummary } from "../components/PlacementsReportSummary";
import { PlacementsBreakdownTable } from "../components/PlacementsBreakdownTable";
import { PlacementsDetailedList } from "../components/PlacementsDetailedList";

function getDefaultFrom(): string {
  const now = new Date();
  // Start of current month in UTC
  return format(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), "yyyy-MM-dd");
}

function getDefaultTo(): string {
  const now = new Date();
  return format(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), "yyyy-MM-dd");
}

export function PlacementsReportPage() {
  const [from, setFrom] = useState<string>(getDefaultFrom());
  const [to, setTo] = useState<string>(getDefaultTo());

  const { data, isLoading, error } = usePlacementsReportQuery({ from, to });

  useEffect(() => {
    if (error) {
      showToast({
        type: "error",
        title: "Error al cargar reporte",
        description: error.message,
      });
    }
  }, [error]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Reporte de placements</h1>
        <p className="text-sm text-muted-foreground">
          Placements confirmados en el rango de fechas seleccionado.
        </p>
      </div>

      {/* Date range filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Desde</span>
          <DatePicker
            value={from}
            onChange={(val) => { if (val) setFrom(val); }}
            maxDate={to}
            placeholder="Fecha inicio"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Hasta</span>
          <DatePicker
            value={to}
            onChange={(val) => { if (val) setTo(val); }}
            minDate={from}
            placeholder="Fecha fin"
          />
        </div>
        {isLoading && (
          <p className="self-end pb-1 text-xs text-muted-foreground">Cargando...</p>
        )}
      </div>

      {/* Summary */}
      {data && (
        <PlacementsReportSummary
          gross={data.summary.gross}
          net={data.summary.net}
          warranty={data.summary.warranty}
        />
      )}

      {/* Breakdowns */}
      {data && (
        <div className="grid gap-6 md:grid-cols-3">
          <PlacementsBreakdownTable title="Por Mes" rows={data.byMonth} />
          <PlacementsBreakdownTable title="Por Cliente" rows={data.byClient} />
          <PlacementsBreakdownTable title="Por Reclutador" rows={data.byRecruiter} />
        </div>
      )}

      {/* Detailed list */}
      {data && <PlacementsDetailedList rows={data.list} />}

      {/* Empty state — data loaded but no results */}
      {data && data.summary.gross === 0 && (
        <p className="text-sm text-muted-foreground">
          No se encontraron placements en el rango seleccionado.
        </p>
      )}
    </div>
  );
}
