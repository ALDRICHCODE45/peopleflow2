"use client";

import { Badge } from "@shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shadcn/card";

interface PlacementsReportSummaryProps {
  gross: number;
  net: number;
  warranty: number;
}

export function PlacementsReportSummary({
  gross,
  net,
  warranty,
}: PlacementsReportSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total placements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{gross}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Placements netos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{net}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Garantías
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <p className="text-3xl font-bold">{warranty}</p>
          {warranty > 0 && (
            <Badge variant="secondary" className="text-xs">
              {warranty} garantía{warranty !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
