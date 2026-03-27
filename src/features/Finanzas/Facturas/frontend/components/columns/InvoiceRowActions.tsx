"use client";

import type { Row } from "@tanstack/react-table";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { useDeleteInvoice } from "../../hooks/useDeleteInvoice";
import { LoadingModalState } from "@/core/shared/components/LoadingModalState";
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
import dynamic from "next/dynamic";
import type { InvoiceDTO } from "../../types/invoice.types";

// ── Lazy-loaded heavy dialogs (Rule 5: lazy-load inside RowActions) ─────────

const EditInvoiceSheet = dynamic(
  () =>
    import("../EditInvoiceSheet").then((mod) => ({
      default: mod.EditInvoiceSheet,
    })),
  {
    ssr: false,
    loading: () => <LoadingModalState />,
  },
);

const DeleteInvoiceDialog = dynamic(
  () =>
    import("../DeleteInvoiceDialog").then((mod) => ({
      default: mod.DeleteInvoiceDialog,
    })),
  {
    ssr: false,
    loading: () => <LoadingModalState />,
  },
);

// ── Component ───────────────────────────────────────────────────────────────

interface InvoiceRowActionsProps {
  row: Row<InvoiceDTO>;
}

/**
 * CRITICAL: Edit sheet and Delete dialog live INSIDE this component.
 * TableBodyDataTable is wrapped in React.memo — if these dialogs lived
 * at page level, the table would NOT re-render after edits/deletes.
 *
 * Follows VacancyRowActions pattern exactly.
 */
export function InvoiceRowActions({ row }: InvoiceRowActionsProps) {
  const invoice = row.original;
  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canEdit =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.facturas.editar,
      PermissionActions.facturas.gestionar,
    ]);

  const canDelete =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.facturas.eliminar,
      PermissionActions.facturas.gestionar,
    ]);

  // ── Modal states (useModalState, NOT useState) ────────────────────────────

  const {
    isOpen: isEditOpen,
    openModal: openEditModal,
    closeModal: closeEditModal,
  } = useModalState();

  const {
    isOpen: isDeleteOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModalState();

  // ── Mutations ─────────────────────────────────────────────────────────────

  const deleteInvoiceMutation = useDeleteInvoice();

  const handleDelete = async () => {
    await deleteInvoiceMutation.mutateAsync(invoice.id);
    closeDeleteModal();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <HugeiconsIcon icon={MoreVerticalIcon} />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <PermissionGuard
            permissions={[
              PermissionActions.facturas.acceder,
              PermissionActions.facturas.gestionar,
            ]}
          >
            <DropdownMenuItem disabled>Ver detalle</DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            permissions={[
              PermissionActions.facturas.editar,
              PermissionActions.facturas.gestionar,
            ]}
          >
            <DropdownMenuItem onClick={openEditModal}>
              Editar
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            permissions={[
              PermissionActions.facturas.eliminar,
              PermissionActions.facturas.gestionar,
            ]}
          >
            <DropdownMenuItem
              onClick={openDeleteModal}
              className="text-destructive focus:text-destructive"
            >
              Eliminar
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Edit Sheet — INSIDE RowActions (React.memo boundary rule) ────── */}
      <PermissionGuard
        permissions={[
          PermissionActions.facturas.editar,
          PermissionActions.facturas.gestionar,
        ]}
      >
        {isEditOpen && (
          <EditInvoiceSheet
            invoice={invoice}
            open={isEditOpen}
            onOpenChange={(open) => !open && closeEditModal()}
          />
        )}
      </PermissionGuard>

      {/* ── Delete Dialog — INSIDE RowActions (React.memo boundary rule) ── */}
      <PermissionGuard
        permissions={[
          PermissionActions.facturas.eliminar,
          PermissionActions.facturas.gestionar,
        ]}
      >
        {isDeleteOpen && (
          <DeleteInvoiceDialog
            isOpen={isDeleteOpen}
            onOpenChange={closeDeleteModal}
            onConfirmDelete={handleDelete}
            invoiceFolio={invoice.folio}
            isLoading={deleteInvoiceMutation.isPending}
          />
        )}
      </PermissionGuard>
    </>
  );
}
