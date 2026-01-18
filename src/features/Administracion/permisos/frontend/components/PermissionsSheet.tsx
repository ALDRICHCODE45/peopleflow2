"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/core/shared/ui/shadcn/sheet";
import { Button } from "@/core/shared/ui/shadcn/button";
import { ScrollArea } from "@/core/shared/ui/shadcn/scroll-area";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import {
  useAllPermissionsQuery,
  useRolePermissionsQuery,
  useAssignPermissionsToRole,
} from "../hooks/usePermissions";
import { PermissionCheckboxGroup } from "./PermissionCheckboxGroup";

interface PermissionsSheetProps {
  roleId: string;
  roleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Orden de los módulos para mostrar
const MODULE_ORDER = [
  "usuarios",
  "roles",
  "ingresos",
  "egresos",
  "vacantes",
  "candidatos",
  "reportes-reclutamiento",
  "leads",
  "reportes-ventas",
  "configuracion",
  "actividad",
  "super",
];

export function PermissionsSheet({
  roleId,
  roleName,
  open,
  onOpenChange,
}: PermissionsSheetProps) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: allPermissions = {}, isLoading: isLoadingAll } =
    useAllPermissionsQuery();
  const { data: rolePermissions = [], isLoading: isLoadingRole } =
    useRolePermissionsQuery(open ? roleId : null);
  const assignMutation = useAssignPermissionsToRole();

  // Cargar permisos del rol cuando se abre
  useEffect(() => {
    if (open && rolePermissions.length > 0) {
      setSelectedIds(rolePermissions);
    } else if (open && !isLoadingRole) {
      setSelectedIds([]);
    }
  }, [open, rolePermissions, isLoadingRole]);

  // Ordenar módulos
  const sortedModules = useMemo(() => {
    const modules = Object.keys(allPermissions);
    return modules.sort((a, b) => {
      const indexA = MODULE_ORDER.indexOf(a);
      const indexB = MODULE_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [allPermissions]);

  const handleToggle = (permissionId: string) => {
    setSelectedIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = (newSelectedIds: string[]) => {
    setSelectedIds(newSelectedIds);
  };

  const handleSave = async () => {
    await assignMutation.mutateAsync({
      roleId,
      permissionIds: selectedIds,
    });
    onOpenChange(false);
  };

  const isLoading = isLoadingAll || isLoadingRole;
  const isSaving = assignMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="xl"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] flex flex-col h-3/4"
        side={sheetSide}
      >
        <SheetHeader>
          <SheetTitle>Asignar Permisos</SheetTitle>
          <SheetDescription>
            Selecciona los permisos para el rol{" "}
            <span className="font-semibold">{roleName}</span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 h-3/4">
          <div className="space-y-6 p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <div className="ml-6 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              sortedModules.map((module, index) => (
                <div key={module}>
                  <PermissionCheckboxGroup
                    module={module}
                    permissions={allPermissions[module] || []}
                    selectedIds={selectedIds}
                    onToggle={handleToggle}
                    onSelectAll={handleSelectAll}
                  />
                  {index < sortedModules.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="p-4 pt-2 border-t">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} permisos seleccionados
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? "Guardando..." : "Guardar Permisos"}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
