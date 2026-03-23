"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/shared/ui/shadcn/card";

export function ClientFinancialSummary() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Resumen Financiero</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ingresos Totales */}
        <div>
          <p className="text-xs text-muted-foreground">Ingresos Totales</p>
          <p className="text-2xl font-semibold mt-1">$0.00</p>
        </div>

        {/* Mini cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Placements</p>
            <p className="text-lg font-semibold mt-0.5">0</p>
          </div>
          <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Valor Promedio</p>
            <p className="text-lg font-semibold mt-0.5">$0</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
