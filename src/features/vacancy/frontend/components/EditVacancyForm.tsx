"use client";

import { useMemo } from "react";
import { Button } from "@shadcn/button";
import { useEditVacancyForm } from "../hooks/useEditVacancyForm";
import type { VacancyDTO } from "../types/vacancy.types";
import { VACANCY_STATUS_LABELS } from "../types/vacancy.types";
import { VacancyFormFields } from "./VacancyFormFields";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { PermissionActions } from "@/core/shared/constants/permissions";

interface EditVacancyFormProps {
  onClose: () => void;
  vacancy: VacancyDTO;
}

export function EditVacancyForm({ onClose, vacancy }: EditVacancyFormProps) {
  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canEditAssignedAt =
    isSuperAdmin ||
    hasAnyPermission([PermissionActions.vacantes.modificarFechaAsignacion]);

  const canEditTargetDeliveryDate =
    isSuperAdmin ||
    hasAnyPermission([PermissionActions.vacantes.modificarFechaTentativaEntrega]);

  const {
    form,
    users,
    clients,
    detailsModal,
    isSubmitting,
    handleClientChange,
  } = useEditVacancyForm({ onClose, vacancy, canEditTargetDeliveryDate });

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name ?? u.email,
        avatar: u.avatar,
      })),
    [users],
  );

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: c.id,
        label: c.nombre,
      })),
    [clients],
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <VacancyFormFields
        form={form}
        userOptions={userOptions}
        clientOptions={clientOptions}
        canEditAssignedAt={canEditAssignedAt}
        canEditTargetDeliveryDate={canEditTargetDeliveryDate}
        currentStatus={VACANCY_STATUS_LABELS[vacancy.status]}
        showNotification={false}
        detailsModalOpen={detailsModal.isOpen}
        openDetailsModal={detailsModal.openModal}
        closeDetailsModal={detailsModal.closeModal}
        handleClientChange={handleClientChange}
        showChecklist={false}
      />

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cerrar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
