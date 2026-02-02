"use client";

import { Row } from "@tanstack/react-table";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import type { Lead } from "../../../types";
import { useDeleteLead } from "../../../hooks/useLeads";
import { Button } from "@/core/shared/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/shared/ui/shadcn/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { LeadSheetForm } from "../LeadSheetForm";
import { DeleteLeadAlertDialog } from "../DeleteLeadAlertDialog";
import { LeadDetailSheet } from "../LeadDetailSheet";

export function LeadRowActions({ row }: { row: Row<Lead> }) {
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
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
              Detalles
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
