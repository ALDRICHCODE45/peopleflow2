"use client";

import type { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
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
import { MoreVerticalIcon, PencilEdit01Icon } from "@hugeicons/core-free-icons";

interface ClientRowActionsProps {
  row: Row<ClientDTO>;
  onEdit?: (client: ClientDTO) => void;
}

export function ClientRowActions({ row, onEdit }: ClientRowActionsProps) {
  const client = row.original;
  const router = useRouter();

  const handleViewDetail = () => {
    router.push(`/finanzas/clientes/${client.id}`);
  };

  const handleEdit = () => {
    onEdit?.(client);
  };

  return (
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
            PermissionActions.clientes.acceder,
            PermissionActions.clientes.gestionar,
          ]}
        >
          <DropdownMenuItem onClick={handleViewDetail}>
            Ver detalle
          </DropdownMenuItem>
        </PermissionGuard>
        {onEdit && (
          <PermissionGuard
            permissions={[
              PermissionActions.clientes.editar,
              PermissionActions.clientes.gestionar,
            ]}
          >
            <DropdownMenuItem onClick={handleEdit}>Editar</DropdownMenuItem>
          </PermissionGuard>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
