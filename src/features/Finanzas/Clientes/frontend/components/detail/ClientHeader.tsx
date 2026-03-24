"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  PencilEdit01Icon,
  Briefcase01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/shared/ui/shadcn/dropdown-menu";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useUserById } from "@/features/Administracion/usuarios/frontend/hooks/useUserById";
import { PaymentSchemeLabels } from "../../types/client.types";
import type { ClientDTO } from "../../types/client.types";
import { cn } from "@/core/lib/utils";

interface ClientHeaderProps {
  client: ClientDTO;
  onEdit: () => void;
}

const schemeColorMap: Record<string, string> = {
  SUCCESS_100:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  ADVANCE:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
};

const avatarColorPalette = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColorPalette[Math.abs(hash) % avatarColorPalette.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ClientHeader({ client, onEdit }: ClientHeaderProps) {
  const isMobile = useIsMobile();
  const initials = getInitials(client.nombre);
  const avatarColor = getAvatarColor(client.nombre);
  const { data: generador, isLoading: isLoadingGenerador } = useUserById(
    client.generadorId,
  );

  return (
    <div className="bg-muted/30 dark:bg-muted/10 border-b">
      <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6">
        {/* Back button */}
        <Link
          href="/finanzas/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          <span>Clientes</span>
        </Link>

        <div className="flex items-start justify-between gap-4">
          {/* Left: Avatar + Info */}
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className={cn("size-14 md:size-16 shrink-0", avatarColor)}>
              <AvatarFallback
                className={cn("text-lg md:text-xl font-semibold")}
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold truncate">
                  {client.nombre}
                </h1>
              </div>
              {client.generadorId && (
                <div className="mt-1.5">
                  {isLoadingGenerador ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                  ) : generador ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={generador.avatar ?? undefined}
                          alt={generador.name}
                        />
                        <AvatarFallback className="text-[10px]">
                          {generador.name
                            ? generador.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : generador.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {generador.name || "-"}
                        </div>
                        <span className="text-muted-foreground text-xs truncate block">
                          {generador.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {client.generadorName || "-"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!isMobile ? (
              <>
                <PermissionGuard
                  permissions={[
                    PermissionActions.clientes.editar,
                    PermissionActions.clientes.gestionar,
                  ]}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="gap-1.5"
                  >
                    <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
                    Editar Cliente
                  </Button>
                </PermissionGuard>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled
                >
                  <HugeiconsIcon icon={Briefcase01Icon} className="size-4" />
                  Crear Vacante
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Acciones">
                    <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    Editar Cliente
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>Crear Vacante</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
