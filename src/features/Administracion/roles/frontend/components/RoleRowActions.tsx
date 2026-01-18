"use client";

import { useState } from "react";
import { Button } from "@/core/shared/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/shared/ui/shadcn/dropdown-menu";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Ellipsis,
  PencilEdit01Icon,
  SecurityCheckIcon,
  DeleteIcon,
} from "@hugeicons/core-free-icons";
import type { RoleWithStats } from "../types";
import { RoleSheetForm } from "./RoleSheetForm";
import { DeleteRoleAlertDialog } from "./DeleteRoleAlertDialog";
import { PermissionsSheet } from "@/features/Administracion/permisos/frontend/components/PermissionsSheet";

interface RoleRowActionsProps {
  role: RoleWithStats;
}

export function RoleRowActions({ role }: RoleRowActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isSuperAdminRole = role.name === "superadmin";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <HugeiconsIcon icon={Ellipsis} className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Asignar permisos - disponible para SuperAdmin o usuarios con permiso */}
          <PermissionGuard
            permissions={[
              PermissionActions.roles.asignarPermisos,
              PermissionActions.roles.gestionar,
            ]}
          >
            <DropdownMenuItem onClick={() => setIsPermissionsOpen(true)}>
              <HugeiconsIcon icon={SecurityCheckIcon} className="mr-2 h-4 w-4" />
              Asignar Permisos
            </DropdownMenuItem>
          </PermissionGuard>

          {/* Editar rol - solo SuperAdmin y no es el rol superadmin */}
            <PermissionGuard permissions={[PermissionActions.roles.editar, PermissionActions.roles.gestionar]}>
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <HugeiconsIcon icon={PencilEdit01Icon} className="mr-2 h-4 w-4" />
                Editar Rol
              </DropdownMenuItem>
            </PermissionGuard>

          {/* Eliminar rol - solo SuperAdmin, no es superadmin y no tiene usuarios */}
            <PermissionGuard permissions={[PermissionActions.roles.gestionar, PermissionActions.roles.eliminar]}>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <HugeiconsIcon icon={DeleteIcon} className="mr-2 h-4 w-4" />
                Eliminar Rol
              </DropdownMenuItem>
            </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sheet para editar rol */}
      <RoleSheetForm
        role={role}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      {/* Sheet para asignar permisos */}
      <PermissionsSheet
        roleId={role.id}
        roleName={role.name}
        open={isPermissionsOpen}
        onOpenChange={setIsPermissionsOpen}
      />

      {/* Dialog para eliminar */}
      <DeleteRoleAlertDialog
        role={role}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
