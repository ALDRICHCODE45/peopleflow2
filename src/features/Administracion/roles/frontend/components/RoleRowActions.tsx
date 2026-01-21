"use client";

import type { RoleWithStats } from "../types";
import { RoleSheetForm } from "./RoleSheetForm";
import { PermissionsSheet } from "@/features/Administracion/permisos/frontend/components/PermissionsSheet";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { RoleActionsDrodown } from "./RoleActionsDropdown";
import { createRoleActions } from "../types/RoleActionsList";
import { useDeleteRole } from "../hooks/useRoles";
import { DeleteRoleAlertDialog } from "./DeleteRoleAlertDialog";
import { showToast } from "@/core/shared/components/ShowToast";

interface RoleRowActionsProps {
  role: RoleWithStats;
}

export function RoleRowActions({ role }: RoleRowActionsProps) {
  const deleteRoleMutation = useDeleteRole();

  const {
    isOpen: isDeleteOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModalState();

  const {
    isOpen: isUpdateOpen,
    openModal: openUpdateModal,
    closeModal: closeUpdateModal,
  } = useModalState();

  const {
    isOpen: isPermissionsOpen,
    openModal: openPermissionModel,
    closeModal: closePermissionsModal,
  } = useModalState();

  const handleDeleteRole = async () => {
    await deleteRoleMutation.mutateAsync(role.id, {
      onSuccess: () => {
        closeDeleteModal();
        showToast({
          title: "Role eliminado",
          description: "El role fue eliminado exitosamente.",
          type: "success",
        });
      },
      onError: () => {
        showToast({
          title: "Error",
          description:
            deleteRoleMutation.error?.message ||
            "No se pudo eliminar el role. Por favor, intenta nuevamente.",
          type: "error",
        });
      },
    });
    closeDeleteModal();
  };

  const actions = createRoleActions(
    openUpdateModal,
    openDeleteModal,
    openPermissionModel,
  );

  return (
    <>
      <RoleActionsDrodown actions={actions} />
      {/* Sheet para editar rol */}

      <RoleSheetForm
        role={role}
        open={isUpdateOpen}
        onOpenChange={closeUpdateModal}
      />

      {/* Sheet para asignar permisos */}
      <PermissionsSheet
        roleId={role.id}
        roleName={role.name}
        open={isPermissionsOpen}
        onOpenChange={closePermissionsModal}
      />

      {/* Dialog para eliminar */}
      <DeleteRoleAlertDialog
        isOpen={isDeleteOpen}
        onOpenChange={closeDeleteModal}
        roleNameToDelete={role.name}
        onConfirmDelete={handleDeleteRole}
        isLoading={deleteRoleMutation.isPending}
      />
    </>
  );
}
