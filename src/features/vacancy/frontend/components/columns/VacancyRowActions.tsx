"use client";
import { Row } from "@tanstack/react-table";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { VacancyActionsDropdown } from "./VacanciesActionsDropdown";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { createVacancyActions } from "./types/VacanciesActionList";
import { Vacancy } from "../../types/vacancy.types";
import { useDeleteVacancy } from "../../hooks/useDeleteVacancy";

export function VacancyRowActions({ row }: { row: Row<Vacancy> }) {
  const vacancy = row.original;
  const { isOpen, openModal, closeModal } = useModalState();
  const {
    isOpen: isDeleteOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModalState();

  const deleteVacancyMutation = useDeleteVacancy();

  const handleDelete = async () => {
    await deleteVacancyMutation.mutateAsync(vacancy.id);
    closeDeleteModal();
  };

  const actions = createVacancyActions(openModal, openDeleteModal);

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
          <div className="p-4">
            <p>Confirmar eliminacion de vacante: {vacancy.title}</p>
            <button onClick={handleDelete} disabled={deleteVacancyMutation.isPending}>
              {deleteVacancyMutation.isPending ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        )}
      </PermissionGuard>

      <PermissionGuard
        permissions={[
          PermissionActions.vacantes.editar,
          PermissionActions.vacantes.gestionar,
        ]}
      >
        {isOpen && <p>Dialog de Editar: {vacancy.title}</p>}
      </PermissionGuard>
    </>
  );
}
