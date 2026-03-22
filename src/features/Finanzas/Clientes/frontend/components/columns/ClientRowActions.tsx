"use client";

import { Row } from "@tanstack/react-table";
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
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";

export function ClientRowActions({ row }: { row: Row<ClientDTO> }) {
  const client = row.original;
  const router = useRouter();

  const handleViewDetail = () => {
    router.push(`/finanzas/clientes/${client.id}`);
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
