"use client";

import { useId, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@shadcn/collapsible";

import { Switch } from "@shadcn/switch";
import {
  Settings02Icon,
  Notification03Icon,
  SecurityIcon,
  Plug01FreeIcons,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@shadcn/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shadcn/tabs";
import { Separator } from "@shadcn/separator";
import { Button } from "@shadcn/button";
import { Badge } from "@shadcn/badge";
import { FilterMultiSelect } from "@/core/shared/components/DataTable/FilterMultiSelect";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { SwitchActionNotification } from "../components/SwitchActionNotification";
import { LeadStatusSelector } from "../components/LeadStatusSelector";
import { LeadInactivityConfig } from "../components/LeadInactivityConfig";
import type { LeadStatus } from "@features/Leads/frontend/types";

const NOTIFICATION_MODULES = [
  {
    id: "leads",
    label: "Generación de Leads",
    actions: [
      {
        id: "lead-status-change",
        label: "Lead cambió de estado",
        description: "Cuando un lead cambia de etapa en el pipeline",
      },
      {
        id: "lead-inactive",
        label: "Lead sin actividad",
        description: "Cuando un lead lleva tiempo sin actividad",
      },
    ],
  },
  {
    id: "recruitment",
    label: "Reclutamiento",
    actions: [
      {
        id: "vacancy-created",
        label: "Nueva vacante creada",
        description: "Cuando se publica una nueva vacante",
      },
      {
        id: "candidate-applied",
        label: "Nuevo candidato",
        description: "Cuando un candidato aplica a una vacante",
      },
      {
        id: "interview-scheduled",
        label: "Entrevista programada",
        description: "Cuando se agenda una entrevista",
      },
      {
        id: "candidate-hired",
        label: "Candidato contratado",
        description: "Cuando un candidato es contratado",
      },
      {
        id: "vacancy-closed",
        label: "Vacante cerrada",
        description: "Cuando una vacante se cierra",
      },
    ],
  },
] as const;

const TAB_CONFIG = [
  {
    value: "general",
    label: "General",
    icon: Settings02Icon,
    disabled: true,
  },
  {
    value: "notificaciones",
    label: "Notificaciones",
    icon: Notification03Icon,
    disabled: false,
  },
  {
    value: "seguridad",
    label: "Seguridad",
    icon: SecurityIcon,
    disabled: true,
  },
  {
    value: "integraciones",
    label: "Integraciones",
    icon: Plug01FreeIcons,
    disabled: true,
  },
] as const;

export function ConfiguracionPage() {
  const [selectedAssignedToIds, setSelectedAssignedToIds] = useState<string[]>(
    [],
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeActions, setActiveActions] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>([]);
  const [inactiveStatuses, setInactiveStatuses] = useState<LeadStatus[]>([]);
  const [inactiveTimeValue, setInactiveTimeValue] = useState(48);
  const [inactiveTimeUnit, setInactiveTimeUnit] = useState<"horas" | "dias">(
    "horas",
  );

  const id = useId();

  const { data: users = [] } = useTenantUsersQuery();

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name || u.email })),
    [users],
  );

  const toggleAction = (actionId: string, checked: boolean) => {
    setActiveActions((prev) => ({ ...prev, [actionId]: checked }));
  };

  const handleStatusChange = (status: LeadStatus, checked: boolean) => {
    setSelectedStatuses((prev) =>
      checked ? [...prev, status] : prev.filter((s) => s !== status),
    );
  };

  const handleInactiveStatusChange = (status: LeadStatus, checked: boolean) => {
    setInactiveStatuses((prev) =>
      checked ? [...prev, status] : prev.filter((s) => s !== status),
    );
  };

  const getModuleCount = (
    module: (typeof NOTIFICATION_MODULES)[number],
  ): string => {
    const active = module.actions.filter(
      (a) => activeActions[a.id] === true,
    ).length;
    return `${active}/${module.actions.length}`;
  };

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Configuración
            </h1>
            <p className="text-muted-foreground text-sm">
              Administra las preferencias del sistema
            </p>
          </div>

          <Separator />

          <Tabs
            defaultValue="notificaciones"
            orientation="vertical"
            className="flex flex-col md:flex-row gap-6"
          >
            <TabsList variant="line" className="w-full md:w-64 shrink-0">
              {TAB_CONFIG.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={tab.disabled}
                  className="w-full justify-start gap-2 px-4 py-3"
                >
                  <HugeiconsIcon
                    icon={tab.icon}
                    className="size-4"
                    strokeWidth={2}
                  />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="notificaciones" className="flex-1 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Notificaciones</CardTitle>
                  <CardDescription>
                    Gestiona las preferencias de notificaciones del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Toggle de Notificaciones */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Notificaciones</h3>
                      <Switch
                        id={`${id}-switch`}
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                        aria-describedby={`${id}-hint`}
                      />
                    </div>
                    <p id={`${id}-status`} className="text-sm">
                      Las notificaciones están actualmente{" "}
                      {notificationsEnabled ? (
                        <Badge variant="outline" className="text-primary">
                          Activadas
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive">
                          Desactivadas
                        </Badge>
                      )}
                    </p>
                    <p
                      id={`${id}-hint`}
                      className="text-muted-foreground text-sm"
                    >
                      Cuando estén activadas, los usuarios seleccionados
                      recibirán notificaciones del sistema.
                    </p>
                  </div>

                  {/* Usuarios a notificar */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="text-base font-semibold">
                      Usuarios a notificar
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Selecciona los usuarios que recibirán notificaciones
                    </p>
                    <div className="max-w-md">
                      <FilterMultiSelect
                        label="Usuarios a notificar"
                        options={userOptions}
                        selected={selectedAssignedToIds}
                        onChange={setSelectedAssignedToIds}
                        placeholder="Todos los usuarios"
                      />
                    </div>
                  </div>

                  {/* Acciones a notificar */}
                  <div className="rounded-lg border p-4 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold">
                        Acciones a notificar
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Selecciona las acciones del sistema que generarán
                        notificaciones
                      </p>
                    </div>

                    <div className="space-y-2">
                      {NOTIFICATION_MODULES.map((module) => (
                        <Collapsible key={module.id}>
                          <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md border px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <HugeiconsIcon
                                icon={ArrowRight01Icon}
                                className="size-4 transition-transform group-data-[state=open]:rotate-90"
                                strokeWidth={2}
                              />
                              <span>{module.label}</span>
                            </div>
                            <Badge variant="secondary">
                              {getModuleCount(module)}
                            </Badge>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-2 pl-6">
                            {module.actions.map((action) => (
                              <SwitchActionNotification
                                key={action.id}
                                label={action.label}
                                description={action.description}
                                checked={activeActions[action.id] === true}
                                onCheckedChange={(checked) =>
                                  toggleAction(action.id, checked)
                                }
                              >
                                {action.id === "lead-status-change" &&
                                  activeActions[action.id] === true && (
                                    <LeadStatusSelector
                                      selectedStatuses={selectedStatuses}
                                      onStatusChange={handleStatusChange}
                                    />
                                  )}
                                {action.id === "lead-inactive" &&
                                  activeActions[action.id] === true && (
                                    <LeadInactivityConfig
                                      selectedStatuses={inactiveStatuses}
                                      onStatusChange={
                                        handleInactiveStatusChange
                                      }
                                      timeValue={inactiveTimeValue}
                                      onTimeValueChange={setInactiveTimeValue}
                                      timeUnit={inactiveTimeUnit}
                                      onTimeUnitChange={setInactiveTimeUnit}
                                    />
                                  )}
                              </SwitchActionNotification>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button disabled>Guardar cambios</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general" className="flex-1 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración General</CardTitle>
                  <CardDescription>Próximamente...</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>

            <TabsContent value="seguridad" className="flex-1 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Seguridad</CardTitle>
                  <CardDescription>Próximamente...</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>

            <TabsContent value="integraciones" className="flex-1 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Integraciones</CardTitle>
                  <CardDescription>Próximamente...</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
