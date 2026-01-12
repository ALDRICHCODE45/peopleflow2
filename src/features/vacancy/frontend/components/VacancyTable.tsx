"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shadcn/table";
import { Button } from "@shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shadcn/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontal,
  PencilEdit01Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import { VacancyStatusBadge } from "./VacancyStatusBadge";
import { VacancyForm } from "./VacancyForm";
import { VacancyDeleteDialog } from "./VacancyDeleteDialog";
import type { Vacancy, VacancyStatus } from "../types/vacancy.types";

interface VacancyTableProps {
  vacancies: Vacancy[];
  isLoading: boolean;
  onUpdate: (
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: VacancyStatus;
      department?: string | null;
      location?: string | null;
    }
  ) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null; success: boolean }>;
}

export function VacancyTable({
  vacancies,
  isLoading,
  onUpdate,
  onDelete,
}: VacancyTableProps) {
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [deletingVacancy, setDeletingVacancy] = useState<Vacancy | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Cargando vacantes...</p>
      </div>
    );
  }

  if (vacancies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-muted-foreground">No hay vacantes registradas</p>
        <p className="text-sm text-muted-foreground">
          Crea una nueva vacante para comenzar
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titulo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Ubicacion</TableHead>
            <TableHead>Creada</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vacancies.map((vacancy) => (
            <TableRow key={vacancy.id}>
              <TableCell className="font-medium">{vacancy.title}</TableCell>
              <TableCell>
                <VacancyStatusBadge status={vacancy.status} />
              </TableCell>
              <TableCell>{vacancy.department || "-"}</TableCell>
              <TableCell>{vacancy.location || "-"}</TableCell>
              <TableCell>{formatDate(vacancy.createdAt)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <HugeiconsIcon icon={MoreHorizontal} className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditingVacancy(vacancy)}
                    >
                      <HugeiconsIcon
                        icon={PencilEdit01Icon}
                        className="mr-2 h-4 w-4"
                      />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingVacancy(vacancy)}
                      className="text-destructive"
                    >
                      <HugeiconsIcon
                        icon={Delete01Icon}
                        className="mr-2 h-4 w-4"
                      />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingVacancy && (
        <VacancyForm
          vacancy={editingVacancy}
          open={!!editingVacancy}
          onOpenChange={(open) => !open && setEditingVacancy(null)}
          onSubmit={(data) => onUpdate(editingVacancy.id, data)}
        />
      )}

      {deletingVacancy && (
        <VacancyDeleteDialog
          vacancy={deletingVacancy}
          open={!!deletingVacancy}
          onOpenChange={(open) => !open && setDeletingVacancy(null)}
          onConfirm={() => onDelete(deletingVacancy.id)}
        />
      )}
    </>
  );
}
