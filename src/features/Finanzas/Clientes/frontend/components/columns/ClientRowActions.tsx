"use client";

import type { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
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

interface ClientRowActionsProps {
  row: Row<ClientDTO>;
}

export function ClientRowActions({ row }: ClientRowActionsProps) {
  const client = row.original;
  const router = useRouter();

  const {
    isOpen: isEditOpen,
    openModal: openEditModal,
    closeModal: closeEditModal,
  } = useModalState();

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
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit sheet — lifecycle entirely within row actions */}
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
    </>
  );
}
