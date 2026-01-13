"use client";
import { Row } from "@tanstack/react-table";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { VacancyActionsDropdown } from "./VacanciesActionsDropdown";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { createVacancyActions } from "./types/VacanciesActionList";
import { Vacancy, VacancyStatus } from "../../types/vacancy.types";
import { useDeleteVacancy } from "../../hooks/useDeleteVacancy";
import { LoadingModalState } from "@/core/shared/components/LoadingModalState";
import dynamic from "next/dynamic";
import { useUpdateVacancy } from "../../hooks/useUpdateVacancy";

const DeleteVacancyAlertDialog = dynamic(
  () =>
    import("../DeleteVacancyAlertDialog").then((mod) => ({
      default: mod.DeleteColaboradorAlertDialog,
    })),
  {
    ssr: false,
    loading: () => <LoadingModalState />,
  },
);

const VacancyForm = dynamic(
  () =>
    import("../VacancyForm").then((mod) => ({
      default: mod.VacancyForm,
    })),
  {
    ssr: false,
    loading: () => <LoadingModalState />,
  },
);

export function VacancyRowActions({ row }: { row: Row<Vacancy> }) {
  const vacancy = row.original;
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

  const handleUpdate = async (data: {
    title: string;
    description: string;
    status?: VacancyStatus;
    department?: string;
    location?: string;
  }) => {
    try {
      await updateVacancyMutation.mutateAsync({
        id: vacancy.id,
        ...data,
      });
      return {
        error: null,
      };
    } catch (e) {
      console.error(e);
      return {
        error: "Error",
      };
    } finally {
      closeUpdateModal();
    }
  };

  const handleDelete = async () => {
    await deleteVacancyMutation.mutateAsync(vacancy.id);
    closeDeleteModal();
  };

  const actions = createVacancyActions(openUpdateModal, openDeleteModal);

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
            vacancyToDelete={vacancy.title}
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
          <VacancyForm
            onSubmit={(data) => handleUpdate(data)}
            vacancy={vacancy}
            onOpenChange={closeUpdateModal}
            open
          />
        )}
      </PermissionGuard>
    </>
  );
}
