"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Settings02Icon,
  Notification03Icon,
  SecurityIcon,
  Plug01FreeIcons,
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
import { FilterMultiSelect } from "@/core/shared/components/DataTable/FilterMultiSelect";

const MOCK_USERS = [
  { value: "user-1", label: "Carlos Mendoza" },
  { value: "user-2", label: "Maria Garcia" },
  { value: "user-3", label: "Juan Rodriguez" },
  { value: "user-4", label: "Ana Martinez" },
  { value: "user-5", label: "Pedro Sanchez" },
];

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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  return (
    <Card className="p-2 m-1 min-h-[90vh]">
      <CardContent className="h-9/10">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Configuracion
            </h1>
            <p className="text-muted-foreground text-sm">
              Administra las preferencias del sistema
            </p>
          </div>

          <Separator />

          {/* Tabs Verticales */}
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
                  <CardTitle>Configuracion de Notificaciones</CardTitle>
                  <CardDescription>
                    Selecciona los usuarios que recibiran notificaciones del
                    sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="max-w-md">
                    <FilterMultiSelect
                      label="Usuarios que reciben notificaciones"
                      options={MOCK_USERS}
                      selected={selectedUsers}
                      onChange={setSelectedUsers}
                      placeholder="Seleccionar usuarios..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button>Guardar cambios</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general" className="flex-1 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Configuracion General</CardTitle>
                  <CardDescription>Proximamente...</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>

            <TabsContent value="seguridad" className="flex-1 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Configuracion de Seguridad</CardTitle>
                  <CardDescription>Proximamente...</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>

            <TabsContent value="integraciones" className="flex-1 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Integraciones</CardTitle>
                  <CardDescription>Proximamente...</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
