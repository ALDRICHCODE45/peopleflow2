"use client";

import { useMemo } from "react";
import { Button } from "@shadcn/button";
import { useEditVacancyForm } from "../hooks/useEditVacancyForm";
import type { VacancyDTO } from "../types/vacancy.types";
import { VACANCY_STATUS_LABELS } from "../types/vacancy.types";
import { VacancyFormFields } from "./VacancyFormFields";

interface EditVacancyFormProps {
  onClose: () => void;
  vacancy: VacancyDTO;
}

export function EditVacancyForm({ onClose, vacancy }: EditVacancyFormProps) {
  const {
    form,
    users,
    clients,
    saleType,
    detailsModal,
    isSubmitting,
    handleClientChange,
  } = useEditVacancyForm({ onClose, vacancy });

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
        saleType={saleType}
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
