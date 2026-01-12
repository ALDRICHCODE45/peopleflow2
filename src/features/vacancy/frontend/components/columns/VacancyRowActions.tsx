"use client";
import { Row } from "@tanstack/react-table";
import { useModalState } from "@/core/shared/hooks/useModalState";
import dynamic from "next/dynamic";
import { LoadingModalState } from "@/core/shared/components/LoadingModalState";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { VacancyActionsDropdown } from "./VacanciesActionsDropdown";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { createVacancyActions } from "./types/VacanciesActionList";
import { Vacancy } from "../../types/vacancy.types";

// const EditSocioSheet = dynamic(
//   () =>
//     import("../EditSocioSheet").then((mod) => ({
//       default: mod.EditSocioSheet,
//     })),
//   {
//     ssr: false,
//     loading: () => <LoadingModalState />,
//   }
// );
//
// const DeleteSocioAlertDialog = dynamic(
//   () =>
//     import("../DeleteSocioAlertDialog").then((mod) => ({
//       default: mod.DeleteSocioAlertDialog,
//     })),
//   {
//     ssr: false,
//     loading: () => <LoadingModalState />,
//   }
// );

export function VacancyRowActions({ row }: { row: Row<Vacancy> }) {
  const socio = row.original;
  const { isOpen, openModal, closeModal } = useModalState();
  const {
    isOpen: isDeleteOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModalState();

  //const deleteVacacncyMutation= useDeleteVacancy(); // No implementado -> Implementar con Tan Stack Query

  const handleDelete = async () => {
    // await deleteSocioMutation.mutateAsync(socio.id);
    console.log("Vacante eliminada");
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
        {isDeleteOpen && <p>Dialog de Eliminar</p>}

        {/* <DeleteSocioAlertDialog */}
        {/*   isOpen={isDeleteOpen} */}
        {/*   onOpenChange={closeDeleteModal} */}
        {/*   onConfirmDelete={handleDelete} */}
        {/*   socioToDelete={socio.nombre} */}
        {/*   isLoading={deleteSocioMutation.isPending} */}
        {/* /> */}
      </PermissionGuard>

      <PermissionGuard
        permissions={[
          PermissionActions.vacantes.editar,
          PermissionActions.vacantes.gestionar,
        ]}
      >
        {isOpen && <p>Dialog de Eliminar</p>}
        {/* <EditSocioSheet socio={socio} isOpen={true} onClose={closeModal} /> */}
      </PermissionGuard>
    </>
  );
}
