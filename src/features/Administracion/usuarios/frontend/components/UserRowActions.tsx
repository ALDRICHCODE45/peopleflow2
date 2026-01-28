"use client";

import { useState } from "react";
import { Button } from "@/core/shared/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/shared/ui/shadcn/dropdown-menu";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { HugeiconsIcon } from "@hugeicons/react";
import { Ellipsis } from "@hugeicons/core-free-icons";
import type { TenantUser } from "../types";
import { UserSheetForm } from "./UserSheetForm";
import { UserRolesSheet } from "./UserRolesSheet";
import { DeleteUserAlertDialog } from "./DeleteUserAlertDialog";

interface UserRowActionsProps {
  user: TenantUser;
}

export function UserRowActions({ user }: UserRowActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRolesOpen, setIsRolesOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <PermissionGuard
            permissions={[
              PermissionActions.usuarios.editar,
              PermissionActions.usuarios.gestionar,
            ]}
          >
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
              Editar
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            permissions={[
              PermissionActions.usuarios.asignarRoles,
              PermissionActions.usuarios.gestionar,
            ]}
          >
            <DropdownMenuItem onClick={() => setIsRolesOpen(true)}>
              Roles
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            permissions={[
              PermissionActions.usuarios.eliminar,
              PermissionActions.usuarios.gestionar,
            ]}
          >
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              variant="destructive"
            >
              Eliminar
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sheet para editar usuario */}

      <PermissionGuard permissions={[PermissionActions.usuarios.editar]}>
        <UserSheetForm
          user={user}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      </PermissionGuard>

      {/* Sheet para asignar roles */}

      <PermissionGuard permissions={[PermissionActions.usuarios.asignarRoles]}>
        <UserRolesSheet
          user={user}
          open={isRolesOpen}
          onOpenChange={setIsRolesOpen}
        />
      </PermissionGuard>
      <PermissionGuard permissions={[PermissionActions.usuarios.eliminar]}>
        {/* Dialog para eliminar */}
        <DeleteUserAlertDialog
          user={user}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
        />
      </PermissionGuard>
    </>
  );
}
