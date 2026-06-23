"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@shadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shadcn/table";
import type { PlacementListRow } from "../types/vacancy.types";

interface PlacementsDetailedListProps {
  rows: PlacementListRow[];
}

export function PlacementsDetailedList({ rows }: PlacementsDetailedListProps) {
  if (rows.length === 0) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold">Detalle de placements</h3>
        <p className="text-sm text-muted-foreground">
          Sin placements en el rango seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">Detalle de placements</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vacante / Posición</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Reclutador</TableHead>
              <TableHead>Fecha placement</TableHead>
              <TableHead>Garantía</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.vacancyId}>
                <TableCell className="font-medium">{row.position}</TableCell>
                <TableCell>{row.clientName}</TableCell>
                <TableCell>{row.recruiterName}</TableCell>
                <TableCell>
                  {format(parseISO(row.placedAt), "dd/MM/yyyy", {
                    locale: es,
                  })}
                </TableCell>
                <TableCell>
                  {row.isWarranty ? (
                    <Badge variant="destructive" className="text-xs">
                      Garantía
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
