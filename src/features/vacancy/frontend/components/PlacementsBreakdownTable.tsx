"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shadcn/table";
import type { BreakdownRow } from "../types/vacancy.types";

interface PlacementsBreakdownTableProps {
  title: string;
  rows: BreakdownRow[];
}

export function PlacementsBreakdownTable({
  title,
  rows,
}: PlacementsBreakdownTableProps) {
  if (rows.length === 0) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">Sin datos en el rango seleccionado.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dimensión</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Netos</TableHead>
              <TableHead className="text-right">Garantías</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="text-right">{row.gross}</TableCell>
                <TableCell className="text-right">{row.net}</TableCell>
                <TableCell className="text-right">{row.warranty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
