"use client";
import type { Row } from "@tanstack/react-table";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { VacancyActionsDropdown } from "./VacanciesActionsDropdown";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { createVacancyActions } from "./types/VacanciesActionList";
import type { VacancyDTO } from "../../types/vacancy.types";
import { useDeleteVacancy } from "../../hooks/useDeleteVacancy";
import { LoadingModalState } from "@/core/shared/components/LoadingModalState";
import dynamic from "next/dynamic";
import { useUpdateVacancy } from "../../hooks/useUpdateVacancy";
import { VacancySheetForm } from "../VacancySheetForm";
import { usePermissions } from "@/core/shared/hooks/use-permissions";


const DeleteVacancyAlertDialog = dynamic(
  () =>
    import("../DeleteVacancyAlertDialog").then((mod) => ({
      default: mod.DeleteColaboradorAlertDialog,
    })),
  {
    ssr: false,
    loading: () => <LoadingModalState />,
  }
);

interface VacancyRowActionsProps {
  row: Row<VacancyDTO>;
  onViewDetail?: (id: string) => void;
}

export function VacancyRowActions({ row, onViewDetail }: VacancyRowActionsProps) {
  const vacancy = row.original;
  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canEdit =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.editar,
      PermissionActions.vacantes.gestionar,
    ]);

  const canDelete =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.eliminar,
      PermissionActions.vacantes.gestionar,
    ]);

  const {
    isOpen: isDeleteOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModalState();

  const {
    isOpen: isUpdateModalOpen,
    openModal: openUpdateModal,
    closeModal: closeUpdateModal,
  } = useModalState();

  const deleteVacancyMutation = useDeleteVacancy();
  const updateVacancyMutation = useUpdateVacancy();

  const handleUpdate = async (
    data: Parameters<typeof updateVacancyMutation.mutateAsync>[0]["data"]
  ) => {
    try {
      await updateVacancyMutation.mutateAsync({ id: vacancy.id, data });
      return { error: null };
    } catch (e) {
      console.error(e);
      return { error: "Error al actualizar la vacante" };
    } finally {
      closeUpdateModal();
    }
  };

  const handleDelete = async () => {
    await deleteVacancyMutation.mutateAsync(vacancy.id);
    closeDeleteModal();
  };

  const actions = createVacancyActions(
    canEdit ? openUpdateModal : undefined,
    canDelete ? openDeleteModal : undefined,
    onViewDetail ? () => onViewDetail(vacancy.id) : undefined
  );

  return (
    <>
      <VacancyActionsDropdown actions={actions} />

      <PermissionGuard
        permissions={[
          PermissionActions.vacantes.eliminar,
          PermissionActions.vacantes.gestionar,
        ]}
      >
        {isDeleteOpen && (
          <DeleteVacancyAlertDialog
            isOpen={isDeleteOpen}
            onOpenChange={closeDeleteModal}
            onConfirmDelete={handleDelete}
            vacancyToDelete={vacancy.position}
            isLoading={deleteVacancyMutation.isPending}
          />
        )}
      </PermissionGuard>

      <PermissionGuard
        permissions={[
          PermissionActions.vacantes.editar,
          PermissionActions.vacantes.gestionar,
        ]}
      >
        {isUpdateModalOpen && (
          <VacancySheetForm
            vacancy={vacancy}
            onOpenChange={closeUpdateModal}
            open
          />
        )}
      </PermissionGuard>
    </>
  );
}
