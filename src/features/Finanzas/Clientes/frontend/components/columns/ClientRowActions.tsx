"use client";

import type { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { useDeleteClient } from "../../hooks/useDeleteClient";
import { LoadingModalState } from "@/core/shared/components/LoadingModalState";
import type { ClientDTO } from "../../types/client.types";
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
import { ClientSheetForm } from "../ClientSheetForm";
import dynamic from "next/dynamic";

// ── Lazy-loaded delete dialog ───────────────────────────────────────────────

const DeleteClientDialog = dynamic(
  () =>
    import("../DeleteClientDialog").then((mod) => ({
      default: mod.DeleteClientDialog,
    })),
  {
    ssr: false,
    loading: () => <LoadingModalState />,
  },
);

interface ClientRowActionsProps {
  row: Row<ClientDTO>;
}

export function ClientRowActions({ row }: ClientRowActionsProps) {
  const client = row.original;
  const router = useRouter();

  // ── Modal states ─────────────────────────────────────────────────────────

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

  // ── Mutations ────────────────────────────────────────────────────────────

  const deleteClientMutation = useDeleteClient();

  const handleDelete = async () => {
    await deleteClientMutation.mutateAsync(client.id);
    closeDeleteModal();
  };

  const handleViewDetail = () => {
    router.push(`/finanzas/clientes/${client.id}`);
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
              PermissionActions.clientes.acceder,
              PermissionActions.clientes.gestionar,
            ]}
          >
            <DropdownMenuItem onClick={handleViewDetail}>
              Ver detalle
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            permissions={[
              PermissionActions.clientes.editar,
              PermissionActions.clientes.gestionar,
            ]}
          >
            <DropdownMenuItem onClick={openEditModal}>
              Editar
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            permissions={[
              PermissionActions.clientes.eliminar,
              PermissionActions.clientes.gestionar,
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
          PermissionActions.clientes.editar,
          PermissionActions.clientes.gestionar,
        ]}
      >
        {isEditOpen && (
          <ClientSheetForm
            client={client}
            open={isEditOpen}
            onOpenChange={closeEditModal}
          />
        )}
      </PermissionGuard>

      {/* ── Delete Dialog — INSIDE RowActions (React.memo boundary rule) ── */}
      <PermissionGuard
        permissions={[
          PermissionActions.clientes.eliminar,
          PermissionActions.clientes.gestionar,
        ]}
      >
        {isDeleteOpen && (
          <DeleteClientDialog
            isOpen={isDeleteOpen}
            onOpenChange={closeDeleteModal}
            onConfirmDelete={handleDelete}
            clientName={client.nombre}
            isLoading={deleteClientMutation.isPending}
          />
        )}
      </PermissionGuard>
    </>
  );
}
