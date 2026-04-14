"use client";

import { Row } from "@tanstack/react-table";
import { useState } from "react";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import type { Lead, LeadStatus } from "../../../types";
import { LEAD_STATUS_LABELS, LEAD_STATUS_OPTIONS } from "../../../types";
import { useDeleteLead } from "../../../hooks/useLeads";
import { Button } from "@/core/shared/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/core/shared/ui/shadcn/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { LeadSheetForm } from "../LeadSheetForm";
import { DeleteLeadAlertDialog } from "../DeleteLeadAlertDialog";
import { LeadDetailSheet } from "../LeadDetailSheet";

export interface LeadRowActionCallbacks {
  /** Llamado cuando el usuario solicita cambiar el estado de un lead */
  onStatusChange: (lead: Lead, newStatus: LeadStatus) => void;
  /** Llamado cuando hay datos incompletos — abre el edit sheet en la página */
  onEditLead: (lead: Lead) => void;
}

interface LeadRowActionsProps {
  row: Row<Lead>;
  callbacks?: LeadRowActionCallbacks;
}

export function LeadRowActions({ row, callbacks }: LeadRowActionsProps) {
  const lead = row.original;

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

  const {
    isOpen: isDetailOpen,
    openModal: openDetailModal,
    closeModal: closeDetailModal,
  } = useModalState();

  const deleteLeadMutation = useDeleteLead();

  const handleDelete = async () => {
    await deleteLeadMutation.mutateAsync(lead.id);
    closeDeleteModal();
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    if (callbacks?.onStatusChange) {
      callbacks.onStatusChange(lead, newStatus);
    }
  };

  // Opciones de estado excluyendo el estado actual
  const availableStatuses = LEAD_STATUS_OPTIONS.filter(
    (opt) => opt.value !== lead.status,
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <HugeiconsIcon icon={MoreVerticalIcon} />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <PermissionGuard
            permissions={[
              PermissionActions.leads.acceder,
              PermissionActions.leads.gestionar,
            ]}
          >
            <DropdownMenuItem onClick={openDetailModal}>
              Ver detalles
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            permissions={[
              PermissionActions.leads.editar,
              PermissionActions.leads.gestionar,
            ]}
          >
            <DropdownMenuItem onClick={openUpdateModal}>
              Editar
            </DropdownMenuItem>
          </PermissionGuard>

          {/* Cambio de estado — solo si hay callbacks (página los provee) */}
          {callbacks && (
            <PermissionGuard
              permissions={[
                PermissionActions.leads.editar,
                PermissionActions.leads.gestionar,
              ]}
            >
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Cambiar estado
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {availableStatuses.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </PermissionGuard>
          )}

          <DropdownMenuSeparator />

          <PermissionGuard
            permissions={[
              PermissionActions.leads.eliminar,
              PermissionActions.leads.gestionar,
            ]}
          >
            <DropdownMenuItem onClick={openDeleteModal} variant="destructive">
              Eliminar
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de detalle */}
      <PermissionGuard
        permissions={[
          PermissionActions.leads.acceder,
          PermissionActions.leads.gestionar,
        ]}
      >
        <LeadDetailSheet
          lead={lead}
          open={isDetailOpen}
          onOpenChange={closeDetailModal}
        />
      </PermissionGuard>

      {/* Modal de edición */}
      <PermissionGuard
        permissions={[
          PermissionActions.leads.editar,
          PermissionActions.leads.gestionar,
        ]}
      >
        <LeadSheetForm
          lead={lead}
          open={isUpdateModalOpen}
          onOpenChange={closeUpdateModal}
        />
      </PermissionGuard>

      {/* Modal de eliminación */}
      <PermissionGuard
        permissions={[
          PermissionActions.leads.eliminar,
          PermissionActions.leads.gestionar,
        ]}
      >
        <DeleteLeadAlertDialog
          isOpen={isDeleteOpen}
          onOpenChange={closeDeleteModal}
          onConfirmDelete={handleDelete}
          leadName={lead.companyName}
          isLoading={deleteLeadMutation.isPending}
        />
      </PermissionGuard>
    </>
  );
}
