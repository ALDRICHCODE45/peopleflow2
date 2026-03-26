"use client";

import { useMemo } from "react";
import { Checkbox } from "@shadcn/checkbox";
import { Label } from "@shadcn/label";
import { Badge } from "@shadcn/badge";
import {
  UserMultiple02Icon,
  SecurityLockIcon,
  MoneyReceiveSquareIcon,
  MoneySendSquareIcon,
  Briefcase02Icon,
  UserSearch01Icon,
  ChartLineData02Icon,
  UserAdd01Icon,
  Analytics02Icon,
  Settings02Icon,
  Activity01Icon,
  ShieldKeyIcon,
  Invoice02Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@lib/utils";
import type { PermissionItem } from "../types";

interface PermissionCheckboxGroupProps {
  module: string;
  permissions: PermissionItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: (module: string, allIds: string[], select: boolean) => void;
  initialSelectedIds: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  searchQuery?: string;
}

// Mapeo de nombres de módulos para mostrar en español
const MODULE_LABELS: Record<string, string> = {
  usuarios: "Usuarios",
  roles: "Roles",
  ingresos: "Ingresos",
  egresos: "Egresos",
  vacantes: "Vacantes",
  candidatos: "Candidatos",
  "reportes-reclutamiento": "Reportes Reclutamiento",
  configuracion: "Configuración",
  actividad: "Actividad",
  leads: "Leads",
  "reportes-ventas": "Reportes Ventas",
  super: "Super Admin",
  facturas: "Facturas",
};

// Mapeo de iconos por módulo
const MODULE_ICONS: Record<string, IconSvgElement> = {
  usuarios: UserMultiple02Icon,
  roles: SecurityLockIcon,
  ingresos: MoneyReceiveSquareIcon,
  egresos: MoneySendSquareIcon,
  vacantes: Briefcase02Icon,
  candidatos: UserSearch01Icon,
  "reportes-reclutamiento": ChartLineData02Icon,
  leads: UserAdd01Icon,
  "reportes-ventas": Analytics02Icon,
  configuracion: Settings02Icon,
  actividad: Activity01Icon,
  super: ShieldKeyIcon,
  facturas: Invoice02Icon,
};

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function isGestionarPermission(permission: PermissionItem): boolean {
  return (
    permission.action === "gestionar" ||
    permission.name.endsWith(":gestionar")
  );
}

export function PermissionCheckboxGroup({
  module,
  permissions,
  selectedIds,
  onToggle,
  onSelectAll,
  initialSelectedIds,
  isExpanded,
  onToggleExpand,
  searchQuery = "",
}: PermissionCheckboxGroupProps) {
  const moduleLabel = MODULE_LABELS[module] ?? module;

  // Filtrar permisos visibles por búsqueda
  const visiblePermissions = useMemo(() => {
    if (!searchQuery.trim()) return permissions;
    const query = searchQuery.toLowerCase();
    return permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description?.toLowerCase().includes(query) ?? false)
    );
  }, [permissions, searchQuery]);

  const allIds = permissions.map((p) => p.id);
  const allSelected =
    permissions.length > 0 &&
    permissions.every((p) => selectedIds.includes(p.id));
  const someSelected = permissions.some((p) => selectedIds.includes(p.id));
  const selectedInModule = permissions.filter((p) =>
    selectedIds.includes(p.id)
  ).length;

  // Detectar cambios en este módulo vs estado inicial
  const moduleHasChanges = useMemo(() => {
    for (const p of permissions) {
      const wasSelected = initialSelectedIds.includes(p.id);
      const isSelected = selectedIds.includes(p.id);
      if (wasSelected !== isSelected) return true;
    }
    return false;
  }, [permissions, selectedIds, initialSelectedIds]);

  const handleSelectAll = () => {
    onSelectAll(module, allIds, !allSelected);
  };

  // Dynamic badge variant based on selection state
  const badgeVariant = allSelected
    ? "success"
    : someSelected
      ? "warning"
      : "outline";

  const badgeText = allSelected
    ? `✓ ${permissions.length}/${permissions.length}`
    : `${selectedInModule}/${permissions.length}`;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        moduleHasChanges && "border-blue-500/30 bg-blue-500/5"
      )}
    >
      {/* Header row — always visible */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`module-${module}`}
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={handleSelectAll}
          />
          <button
            type="button"
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onToggleExpand}
          >
            <HugeiconsIcon
              icon={MODULE_ICONS[module] ?? SecurityLockIcon}
              className="size-4 text-muted-foreground"
            />
            <Label
              htmlFor={`module-${module}`}
              className="font-semibold cursor-pointer text-sm"
            >
              {moduleLabel}
            </Label>
            <HugeiconsIcon
              icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
              className="size-3.5 text-muted-foreground"
            />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {moduleHasChanges && (
            <span className="text-[10px] text-blue-500 font-medium">
              modificado
            </span>
          )}
          <Badge variant={badgeVariant} className="text-xs tabular-nums">
            {badgeText}
          </Badge>
        </div>
      </div>

      {/* Expandable permission list */}
      {isExpanded && (
        <div className="ml-6 mt-3 space-y-2 border-l pl-4">
          {visiblePermissions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              No hay permisos que coincidan con la búsqueda
            </p>
          ) : (
            visiblePermissions.map((permission) => {
              const wasSelected = initialSelectedIds.includes(permission.id);
              const isSelected = selectedIds.includes(permission.id);
              const changed = wasSelected !== isSelected;
              const isGestionar = isGestionarPermission(permission);
              const permissionDescription =
                permission.description ||
                (isGestionar
                  ? "Incluye todos los permisos de este módulo"
                  : undefined);

              return (
                <div
                  key={permission.id}
                  className={cn(
                    "flex items-start gap-3 rounded-md px-2 py-1 transition-colors hover:bg-accent/50",
                    changed && "bg-blue-500/5",
                    isGestionar && "border-l-2 border-primary pl-1"
                  )}
                >
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={isSelected}
                    onCheckedChange={() => onToggle(permission.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`permission-${permission.id}`}
                      className="font-normal cursor-pointer text-sm"
                    >
                      <span className="font-mono text-xs text-primary">
                        {highlightMatch(permission.name, searchQuery)}
                      </span>
                      {isGestionar && (
                        <span className="text-[10px] bg-primary/10 text-primary rounded px-1 py-0.5 ml-1.5">
                          TOTAL
                        </span>
                      )}
                    </Label>
                    {permissionDescription && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {highlightMatch(permissionDescription, searchQuery)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
