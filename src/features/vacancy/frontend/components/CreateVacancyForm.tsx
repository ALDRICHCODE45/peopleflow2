"use client";

import { useMemo, useState } from "react";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { useCreateVacancyForm } from "../hooks/useCreateVacancyForm";
import { VacancyFormFields } from "./VacancyFormFields";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { FieldError } from "@/core/shared/ui/shadcn/field";
import type { VacancyFormTab } from "../types/vacancy-form.types";

interface CreateVacancyFormProps {
  onClose: () => void;
}

export function CreateVacancyForm({ onClose }: CreateVacancyFormProps) {
  const [activeTab, setActiveTab] = useState<VacancyFormTab>("basic");
  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canEditAssignedAt =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.modificarFechaAsignacion,
      PermissionActions.vacantes.gestionar,
    ]);

  const canEditTargetDeliveryDate =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.modificarFechaTentativaEntrega,
      PermissionActions.vacantes.gestionar,
    ]);

  const {
    form,
    users,
    clients,
    checklist,
    sendNotification,
    setSendNotification,
    validationErrors,
    detailsModal,
    isSubmitting,
    handleClientChange,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
  } = useCreateVacancyForm({ onClose, canEditTargetDeliveryDate, setActiveTab });

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

  const checklistSlot = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Agrega los requisitos que debe cumplir el candidato. *
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addChecklistItem}
          className="gap-1.5"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          Agregar Requisito
        </Button>
      </div>

      {validationErrors.checklist && (
        <FieldError>{validationErrors.checklist}</FieldError>
      )}

      {checklist.length === 0 ? (
        <div
          className={`flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center ${
            validationErrors.checklist ? "border-destructive" : ""
          }`}
        >
          <p className="text-sm text-muted-foreground">
            No hay requisitos aún.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addChecklistItem}
            className="mt-2 gap-1.5"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
            Agregar el primero
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {checklist.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">
                {index + 1}.
              </span>
              <Input
                value={item}
                onChange={(e) => updateChecklistItem(index, e.target.value)}
                placeholder={`Requisito ${index + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeChecklistItem(index)}
                className="shrink-0 text-destructive hover:text-destructive"
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
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
        sendNotification={sendNotification}
        setSendNotification={setSendNotification}
        detailsModalOpen={detailsModal.isOpen}
        openDetailsModal={detailsModal.openModal}
        closeDetailsModal={detailsModal.closeModal}
        handleClientChange={handleClientChange}
        showChecklist={true}
        checklistSlot={checklistSlot}
        validationErrors={validationErrors}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
          {isSubmitting ? "Creando..." : "Crear vacante"}
        </Button>
      </div>
    </form>
  );
}
