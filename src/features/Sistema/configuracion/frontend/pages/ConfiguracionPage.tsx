"use client";

import { useCallback, useId, useMemo } from "react";
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
import {
  useNotificationConfigQuery,
  useSaveNotificationConfig,
} from "../hooks/useNotificationConfig";
import { useNotificationDraft } from "../hooks/useNotificationDraft";

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
  const id = useId();

  const { data: users = [] } = useTenantUsersQuery();
  const { data: savedConfig } = useNotificationConfigQuery();
  const saveConfigMutation = useSaveNotificationConfig();

  const {
    state,
    setEnabled,
    setRecipients,
    toggleAction,
    toggleStatus,
    toggleInactiveStatus,
    setTimeValue,
    setTimeUnit,
  } = useNotificationDraft(savedConfig);

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name || u.email })),
    [users],
  );

  const moduleCounts = useMemo(() => {
    const counts: Record<string, string> = {};
    for (const notification_module of NOTIFICATION_MODULES) {
      const active = notification_module.actions.filter(
        (a) => state.activeActions[a.id] === true,
      ).length;
      counts[module.id] = `${active}/${notification_module.actions.length}`;
    }
    return counts;
  }, [state.activeActions]);

  const handleSave = useCallback(() => {
    saveConfigMutation.mutate({
      enabled: state.enabled,
      recipientUserIds: state.recipientUserIds,
      leadStatusChangeEnabled:
        state.activeActions["lead-status-change"] ?? false,
      leadStatusChangeTriggers: state.selectedStatuses,
      leadInactiveEnabled: state.activeActions["lead-inactive"] ?? false,
      leadInactiveStatuses: state.inactiveStatuses,
      leadInactiveTimeValue: state.inactiveTimeValue,
      leadInactiveTimeUnit:
        state.inactiveTimeUnit === "horas" ? "HOURS" : "DAYS",
    });
  }, [state, saveConfigMutation]);

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
                        checked={state.enabled}
                        onCheckedChange={setEnabled}
                        aria-describedby={`${id}-hint`}
                      />
                    </div>
                    <p id={`${id}-status`} className="text-sm">
                      Las notificaciones están actualmente{" "}
                      {state.enabled ? (
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
                        selected={state.recipientUserIds}
                        onChange={setRecipients}
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
                              {moduleCounts[module.id]}
                            </Badge>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-2 pl-6">
                            {module.actions.map((action) => (
                              <SwitchActionNotification
                                key={action.id}
                                actionId={action.id}
                                label={action.label}
                                description={action.description}
                                checked={
                                  state.activeActions[action.id] === true
                                }
                                onToggle={toggleAction}
                              >
                                {action.id === "lead-status-change" &&
                                  state.activeActions[action.id] === true && (
                                    <LeadStatusSelector
                                      selectedStatuses={state.selectedStatuses}
                                      onStatusChange={toggleStatus}
                                    />
                                  )}
                                {action.id === "lead-inactive" &&
                                  state.activeActions[action.id] === true && (
                                    <LeadInactivityConfig
                                      selectedStatuses={state.inactiveStatuses}
                                      onStatusChange={toggleInactiveStatus}
                                      timeValue={state.inactiveTimeValue}
                                      onTimeValueChange={setTimeValue}
                                      timeUnit={state.inactiveTimeUnit}
                                      onTimeUnitChange={setTimeUnit}
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
                    <Button
                      onClick={handleSave}
                      disabled={saveConfigMutation.isPending}
                    >
                      {saveConfigMutation.isPending
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </Button>
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
