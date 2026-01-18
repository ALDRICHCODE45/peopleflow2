"use client";

import { Checkbox } from "@/core/shared/ui/shadcn/checkbox";
import { Label } from "@/core/shared/ui/shadcn/label";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import type { PermissionItem } from "../types";

interface PermissionCheckboxGroupProps {
  module: string;
  permissions: PermissionItem[];
  selectedIds: string[];
  onToggle: (permissionId: string) => void;
  onSelectAll: (permissionIds: string[]) => void;
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
};

export function PermissionCheckboxGroup({
  module,
  permissions,
  selectedIds,
  onToggle,
  onSelectAll,
}: PermissionCheckboxGroupProps) {
  const moduleLabel = MODULE_LABELS[module] || module;
  const allSelected = permissions.every((p) => selectedIds.includes(p.id));
  const someSelected = permissions.some((p) => selectedIds.includes(p.id));

  const handleSelectAll = () => {
    if (allSelected) {
      // Deseleccionar todos los permisos de este módulo
      const idsToRemove = permissions.map((p) => p.id);
      const newSelected = selectedIds.filter((id) => !idsToRemove.includes(id));
      onSelectAll(newSelected);
    } else {
      // Seleccionar todos los permisos de este módulo
      const idsToAdd = permissions.map((p) => p.id);
      const newSelected = [...new Set([...selectedIds, ...idsToAdd])];
      onSelectAll(newSelected);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`module-${module}`}
            checked={allSelected}
            // @ts-expect-error - indeterminate is valid
            indeterminate={!allSelected && someSelected}
            onCheckedChange={handleSelectAll}
          />
          <Label
            htmlFor={`module-${module}`}
            className="font-semibold cursor-pointer"
          >
            {moduleLabel}
          </Label>
        </div>
        <Badge variant="outline" className="text-xs">
          {permissions.filter((p) => selectedIds.includes(p.id)).length}/
          {permissions.length}
        </Badge>
      </div>

      <div className="ml-6 space-y-2 border-l pl-4">
        {permissions.map((permission) => (
          <div key={permission.id} className="flex items-start gap-3">
            <Checkbox
              id={`permission-${permission.id}`}
              checked={selectedIds.includes(permission.id)}
              onCheckedChange={() => onToggle(permission.id)}
            />
            <div className="flex-1">
              <Label
                htmlFor={`permission-${permission.id}`}
                className="font-normal cursor-pointer text-sm"
              >
                <span className="font-mono text-xs text-primary">
                  {permission.name}
                </span>
              </Label>
              {permission.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {permission.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
