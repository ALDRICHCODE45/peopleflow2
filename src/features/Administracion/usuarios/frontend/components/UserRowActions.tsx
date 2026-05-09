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
import { InviteToTenantDialog } from "./InviteToTenantDialog";
import { ToggleUserActiveDialog } from "./ToggleUserActiveDialog";
import { ChangeUserPasswordDialog } from "./ChangeUserPasswordDialog";
import { useAuth } from "@/core/shared/hooks/use-auth";

interface UserRowActionsProps {
  user: TenantUser;
}

export function UserRowActions({ user }: UserRowActionsProps) {
  const { user: currentUser } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRolesOpen, setIsRolesOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isToggleActiveOpen, setIsToggleActiveOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // No mostrar opcion de invitar para el usuario actual (previene auto-invitacion)
  const canShowInviteOption = user.id !== currentUser?.id;
  
  // No mostrar opción de desactivar para el usuario actual (previene auto-desactivación)
  const canShowToggleOption = user.id !== currentUser?.id;

  // No mostrar opción de cambiar contraseña para el usuario actual
  const canShowChangePasswordOption = user.id !== currentUser?.id;

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

          {canShowToggleOption && (
            <PermissionGuard
              permissions={[
                PermissionActions.usuarios.editar,
                PermissionActions.usuarios.gestionar,
              ]}
            >
              <DropdownMenuItem onClick={() => setIsToggleActiveOpen(true)}>
                {user.isActive ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
            </PermissionGuard>
          )}

          {canShowChangePasswordOption && (
            <PermissionGuard
              permissions={[
                PermissionActions.usuarios.cambiarContrasena,
                PermissionActions.usuarios.gestionar,
              ]}
            >
              <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                Cambiar contraseña
              </DropdownMenuItem>
            </PermissionGuard>
          )}

          {canShowInviteOption && (
            <PermissionGuard
              permissions={[
                PermissionActions.usuarios.invitarTenant,
                PermissionActions.usuarios.gestionar,
              ]}
            >
              <DropdownMenuItem onClick={() => setIsInviteOpen(true)}>
                Invitar a Tenant
              </DropdownMenuItem>
            </PermissionGuard>
          )}

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

      {/* Dialog para invitar a tenant */}
      {canShowInviteOption && (
        <PermissionGuard
          permissions={[
            PermissionActions.usuarios.invitarTenant,
            PermissionActions.usuarios.gestionar,
          ]}
        >
          <InviteToTenantDialog
            user={user}
            open={isInviteOpen}
            onOpenChange={setIsInviteOpen}
          />
        </PermissionGuard>
      )}

      {/* Dialog para activar/desactivar usuario */}
      {canShowToggleOption && (
        <PermissionGuard
          permissions={[
            PermissionActions.usuarios.editar,
            PermissionActions.usuarios.gestionar,
          ]}
        >
          <ToggleUserActiveDialog
            user={user}
            open={isToggleActiveOpen}
            onOpenChange={setIsToggleActiveOpen}
          />
        </PermissionGuard>
      )}

      {/* Dialog para cambiar contraseña */}
      {canShowChangePasswordOption && (
        <PermissionGuard
          permissions={[
            PermissionActions.usuarios.cambiarContrasena,
            PermissionActions.usuarios.gestionar,
          ]}
        >
          <ChangeUserPasswordDialog
            user={user}
            open={isChangePasswordOpen}
            onOpenChange={setIsChangePasswordOpen}
          />
        </PermissionGuard>
      )}
    </>
  );
}
