"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@shadcn/sheet";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { ScrollArea } from "@shadcn/scroll-area";
import { Skeleton } from "@shadcn/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ArrowExpand01Icon,
  ArrowShrink01Icon,
  CheckmarkSquare02Icon,
  MinusSignSquareIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@lib/utils";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import {
  useAllPermissionsQuery,
  useRolePermissionsQuery,
  useAssignPermissionsToRole,
} from "../hooks/usePermissions";
import { PermissionCheckboxGroup } from "./PermissionCheckboxGroup";
import type { PermissionItem } from "../types";

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
  "facturas",
  "vacantes",
  "candidatos",
  "reportes-reclutamiento",
  "leads",
  "reportes-ventas",
  "configuracion",
  "actividad",
  "super",
];

function arraysAreEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

export function PermissionsSheet({
  roleId,
  roleName,
  open,
  onOpenChange,
}: PermissionsSheetProps) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const initialSelectedIdsRef = useRef<string[]>([]);

  const { data: allPermissions = {}, isLoading: isLoadingAll } =
    useAllPermissionsQuery();
  const { data: rolePermissions = [], isLoading: isLoadingRole } =
    useRolePermissionsQuery(open ? roleId : null);
  const assignMutation = useAssignPermissionsToRole();

  // Cargar permisos del rol cuando se abre
  useEffect(() => {
    if (open && rolePermissions.length > 0) {
      setSelectedIds(rolePermissions);
      initialSelectedIdsRef.current = rolePermissions;
    } else if (open && !isLoadingRole) {
      setSelectedIds([]);
      initialSelectedIdsRef.current = [];
    }
  }, [open, rolePermissions, isLoadingRole]);

  // Resetear estado cuando se cierra el sheet
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setExpandedModules(new Set());
    }
  }, [open]);

  // Inicializar expanded con módulos que tienen permisos seleccionados
  useEffect(() => {
    if (open && !isLoadingAll && !isLoadingRole) {
      const modulesWithSelection = new Set<string>();
      for (const [moduleName, permissions] of Object.entries(allPermissions)) {
        const hasSelected = permissions.some((p: PermissionItem) =>
          selectedIds.includes(p.id)
        );
        if (hasSelected) {
          modulesWithSelection.add(moduleName);
        }
      }
      setExpandedModules(modulesWithSelection);
    }
    // Solo al abrir y terminar de cargar, no en cada cambio de selectedIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLoadingAll, isLoadingRole, allPermissions]);

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

  // Módulos filtrados por búsqueda
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return sortedModules;

    const query = searchQuery.toLowerCase();
    return sortedModules.filter((moduleName) => {
      const permissions = allPermissions[moduleName] ?? [];
      // Mostrar módulo si su nombre coincide o tiene permisos que coinciden
      if (moduleName.toLowerCase().includes(query)) return true;
      return permissions.some(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [sortedModules, allPermissions, searchQuery]);

  // Auto-expand/collapse basado en búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();
    const matchingModules = new Set<string>();

    for (const moduleName of sortedModules) {
      const permissions = allPermissions[moduleName] ?? [];
      const hasMatch =
        moduleName.toLowerCase().includes(query) ||
        permissions.some(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.description?.toLowerCase().includes(query) ?? false)
        );
      if (hasMatch) {
        matchingModules.add(moduleName);
      }
    }

    setExpandedModules(matchingModules);
  }, [searchQuery, sortedModules, allPermissions]);

  // Conteos
  const totalCount = useMemo(() => {
    return Object.values(allPermissions).reduce(
      (sum, perms) => sum + perms.length,
      0
    );
  }, [allPermissions]);

  const selectedCount = selectedIds.length;

  const hasChanges = useMemo(() => {
    return !arraysAreEqual(selectedIds, initialSelectedIdsRef.current);
  }, [selectedIds]);

  // Porcentaje y color de la barra de progreso
  const progressPercent = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;
  const progressColor =
    progressPercent > 80
      ? "bg-emerald-500"
      : progressPercent >= 20
        ? "bg-amber-500"
        : "bg-muted-foreground/40";

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleToggle = useCallback((permissionId: string) => {
    setSelectedIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  }, []);

  const handleSelectAllModule = useCallback(
    (module: string, allIds: string[], select: boolean) => {
      setSelectedIds((prev) => {
        if (select) {
          return [...new Set([...prev, ...allIds])];
        }
        const idsToRemove = new Set(allIds);
        return prev.filter((id) => !idsToRemove.has(id));
      });
    },
    []
  );

  const handleToggleExpand = useCallback((moduleName: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleName)) {
        next.delete(moduleName);
      } else {
        next.add(moduleName);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedModules(new Set(sortedModules));
  }, [sortedModules]);

  const handleCollapseAll = useCallback(() => {
    setExpandedModules(new Set());
  }, []);

  const handleSelectAllGlobal = useCallback(() => {
    const allIds = Object.values(allPermissions).flatMap((perms) =>
      perms.map((p) => p.id)
    );
    setSelectedIds(allIds);
  }, [allPermissions]);

  const handleDeselectAllGlobal = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleSave = async () => {
    await assignMutation.mutateAsync({
      roleId,
      permissionIds: selectedIds,
    });
    onOpenChange(false);
  };

  const isLoading = isLoadingAll || isLoadingRole;
  const isSaving = assignMutation.isPending;
  const allExpanded =
    sortedModules.length > 0 &&
    sortedModules.every((m) => expandedModules.has(m));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="xl"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] flex flex-col overflow-hidden"
        side={sheetSide}
      >
        <SheetHeader className="shrink-0 space-y-3">
          <SheetTitle>Asignar Permisos</SheetTitle>
          <SheetDescription>
            Selecciona los permisos para el rol{" "}
            <span className="font-semibold">{roleName}</span>
          </SheetDescription>

          {/* Search Input */}
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            />
            <Input
              className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Buscar permisos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              aria-label="Buscar permisos"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={allExpanded ? handleCollapseAll : handleExpandAll}
              disabled={isLoading}
            >
              <HugeiconsIcon
                icon={allExpanded ? ArrowShrink01Icon : ArrowExpand01Icon}
                className="size-3.5 mr-1"
              />
              {allExpanded ? "Colapsar todo" : "Expandir todo"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={handleSelectAllGlobal}
              disabled={isLoading}
            >
              <HugeiconsIcon
                icon={CheckmarkSquare02Icon}
                className="size-3.5 mr-1"
              />
              Seleccionar todo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={handleDeselectAllGlobal}
              disabled={isLoading || selectedCount === 0}
            >
              <HugeiconsIcon
                icon={MinusSignSquareIcon}
                className="size-3.5 mr-1"
              />
              Deseleccionar todo
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-2 p-4">
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
            ) : filteredModules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <HugeiconsIcon icon={Search01Icon} className="size-8 mb-2 opacity-40" />
                <p className="text-sm">No se encontraron permisos</p>
                <p className="text-xs mt-1">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            ) : (
              filteredModules.map((moduleName) => (
                <PermissionCheckboxGroup
                  key={moduleName}
                  module={moduleName}
                  permissions={allPermissions[moduleName] ?? []}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                  onSelectAll={handleSelectAllModule}
                  initialSelectedIds={initialSelectedIdsRef.current}
                  isExpanded={expandedModules.has(moduleName)}
                  onToggleExpand={() => handleToggleExpand(moduleName)}
                  searchQuery={searchQuery}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="shrink-0 p-4 pt-2 border-t">
          <div className="flex flex-col w-full gap-2">
            {/* Info row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  {selectedCount} de {totalCount} permisos seleccionados
                </span>
                {/* Progress bar */}
                <div className="h-1 w-32 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      progressColor
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {hasChanges && (
                  <span className="text-xs text-blue-500 font-medium">
                    Cambios sin guardar
                  </span>
                )}
              </div>

              {/* Action buttons */}
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
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
