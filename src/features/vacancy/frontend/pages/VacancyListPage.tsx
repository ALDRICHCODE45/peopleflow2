"use client";

import { useState } from "react";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Search01Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { useVacancies } from "../hooks/useVacancies";
import { VacancyTable } from "../components/VacancyTable";
import { VacancyForm } from "../components/VacancyForm";
import type { VacancyStatus } from "../types/vacancy.types";
import { VACANCY_STATUS_OPTIONS } from "../types/vacancy.types";

export function VacancyListPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const {
    vacancies,
    isLoading,
    error,
    filters,
    refresh,
    createVacancy,
    updateVacancy,
    deleteVacancy,
    updateFilters,
  } = useVacancies();

  const handleSearch = () => {
    updateFilters({ search: searchInput || undefined });
  };

  const handleStatusFilter = (status: string) => {
    updateFilters({
      status: status === "ALL" ? undefined : (status as VacancyStatus),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vacantes</h1>
          <p className="text-muted-foreground">
            Gestiona las vacantes de tu organizacion
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
          Nueva Vacante
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Vacantes</CardTitle>
              <CardDescription>
                {vacancies.length} vacante{vacancies.length !== 1 ? "s" : ""}{" "}
                encontrada{vacancies.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={refresh}>
              <HugeiconsIcon icon={ArrowReloadHorizontalIcon} className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Buscar vacantes..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button variant="outline" onClick={handleSearch}>
                <HugeiconsIcon icon={Search01Icon} className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={filters.status || "ALL"}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                {VACANCY_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="p-4 mb-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          <VacancyTable
            vacancies={vacancies}
            isLoading={isLoading}
            onUpdate={updateVacancy}
            onDelete={deleteVacancy}
          />
        </CardContent>
      </Card>

      <VacancyForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={createVacancy}
      />
    </div>
  );
}
