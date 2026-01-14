"use client";

import { useState, useMemo } from "react";
import { useVacanciesQuery } from "../hooks/useVacanciesQuery";
import { useCreateVacancy } from "../hooks/useCreateVacancy";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { VacancyColumns } from "../components/columns/VacancyColumns";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { VacanciesTableConfig } from "../components/tableConfig/VacanciesTableConfig";
import {
  DataTableStats,
  StatCardConfig,
} from "@/core/shared/components/DataTable/DataTableStats";
import {
  DataTableTabs,
  TabConfig,
} from "@/core/shared/components/DataTable/DataTableTabs";
import { Button } from "@shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileDownloadIcon,
  ArrowReloadHorizontalIcon,
  ArrowDown,
  Layers,
  PlayCircleIcon,
  FileEditIcon,
  Lock,
  Archive,
} from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/shared/ui/shadcn/collapsible";
import { VacancySheetForm } from "../components/VacancySheetForm";

export function VacancyListPage() {
  const { data: vacancies = [], isLoading, refetch } = useVacanciesQuery();
  const createVacancyMutation = useCreateVacancy();
  const { isOpen, openModal, closeModal } = useModalState();
  const [activeTab, setActiveTab] = useState<string>("all");

  // Calcular estadisticas
  const stats = useMemo(() => {
    const total = vacancies.length;
    const open = vacancies.filter((v) => v.status === "OPEN").length;
    const draft = vacancies.filter((v) => v.status === "DRAFT").length;
    const closed = vacancies.filter((v) => v.status === "CLOSED").length;
    const archived = vacancies.filter((v) => v.status === "ARCHIVED").length;

    return { total, open, draft, closed, archived };
  }, [vacancies]);

  // Configuracion de estadisticas
  const statsConfig: StatCardConfig[] = [
    {
      id: "total",
      label: "Total Vacantes",
      value: stats.total,
      description: "Todas las vacantes",
    },
    {
      id: "open",
      label: "Vacantes Abiertas",
      value: stats.open,
      description: "En proceso de reclutamiento",
    },
    {
      id: "draft",
      label: "Borradores",
      value: stats.draft,
      description: "Pendientes de publicar",
    },
    {
      id: "closed",
      label: "Cerradas",
      value: stats.closed,
      description: "Proceso finalizado",
    },
  ];

  // Configuracion de tabs
  const tabsConfig: TabConfig[] = [
    { id: "all", label: "Todas", count: stats.total, icon: Layers },
    {
      id: "OPEN",
      label: "Abiertas",
      count: stats.open,
      filterValue: "OPEN",
      icon: PlayCircleIcon,
    },
    {
      id: "DRAFT",
      label: "Borrador",
      count: stats.draft,
      filterValue: "DRAFT",
      icon: FileEditIcon,
    },
    {
      id: "CLOSED",
      label: "Cerradas",
      count: stats.closed,
      filterValue: "CLOSED",
      icon: Lock,
    },
    {
      id: "ARCHIVED",
      label: "Archivadas",
      count: stats.archived,
      filterValue: "ARCHIVED",
      icon: Archive,
    },
  ];

  // Filtrar vacantes segun el tab activo
  const filteredVacancies = useMemo(() => {
    if (activeTab === "all") return vacancies;
    return vacancies.filter((v) => v.status === activeTab);
  }, [vacancies, activeTab]);

  const handleAdd = () => {
    openModal();
  };

  const handleExport = () => {
    console.log("Exportando vacantes...");
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateVacancy = async (
    data: Parameters<typeof createVacancyMutation.mutateAsync>[0],
  ) => {
    const result = await createVacancyMutation.mutateAsync(data);
    if (result) {
      closeModal();
    }
    return { error: null, vacancy: result };
  };

  const tableConfig = createTableConfig(VacanciesTableConfig, {
    onAdd: handleAdd,
  });

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          {/* Header con titulo y acciones */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="mt-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Gestion de Vacantes
              </h1>
              <p className="text-sm text-muted-foreground">
                Administra las vacantes de tu organizacion
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <HugeiconsIcon
                  icon={ArrowReloadHorizontalIcon}
                  className="h-4 w-4 mr-2"
                />
                Actualizar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExport}>
                <HugeiconsIcon
                  icon={FileDownloadIcon}
                  className="h-4 w-4 mr-2"
                />
                Exportar
              </Button>
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                className="[&[data-state=open]>svg]:rotate-180 mb-2"
                variant={"default"}
                size={"icon"}
                buttonTooltip
                buttonTooltipText="Estadisticas rapidas"
              >
                <HugeiconsIcon icon={ArrowDown} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Tarjetas de estadisticas */}
              <DataTableStats
                stats={statsConfig}
                isLoading={isLoading}
                columns={4}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Tabs de filtrado */}
          <DataTableTabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tabla */}
          <PermissionGuard
            permissions={[
              PermissionActions.vacantes.acceder,
              PermissionActions.vacantes.gestionar,
            ]}
          >
            <DataTable
              columns={VacancyColumns}
              data={filteredVacancies}
              config={tableConfig}
              isLoading={isLoading}
            />
          </PermissionGuard>

          {/* Modal de crear vacante */}
          <PermissionGuard
            permissions={[
              PermissionActions.vacantes.crear,
              PermissionActions.vacantes.gestionar,
            ]}
          >
            {isOpen && (
              <VacancySheetForm
                onSubmit={handleCreateVacancy}
                open={true}
                onOpenChange={closeModal}
              />
            )}
          </PermissionGuard>
        </div>
      </CardContent>
    </Card>
  );
}
