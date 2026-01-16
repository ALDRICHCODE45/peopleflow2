"use client";

import { ChevronsUpDown, Building } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@shadcn/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@shadcn/sidebar";
import { Skeleton } from "@shadcn/skeleton";

// Hooks de tenant
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import {
  useUserTenants,
  useSwitchTenant,
} from "@/features/tenants/frontend/hooks/useTenant";

// Server actions
import { getDefaultRouteForTenantAction } from "@/features/auth-rbac/server/presentation/actions/permission.actions";
import { useRouter } from "next/navigation";

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();

  // Hooks de tenant
  const {
    tenant: activeTenant,
    isLoading: isTenantLoading,
    refresh: refreshTenant,
  } = useTenant();
  const { tenants, isLoading: isTenantsLoading } = useUserTenants();
  const { switchTenant, isLoading: isSwitching } = useSwitchTenant();

  const isLoading = isTenantLoading || isTenantsLoading;

  /**
   * Maneja el cambio de tenant
   * 1. Cambia el tenant en la sesión (BD)
   * 2. Actualiza el TenantContext local
   * 3. Obtiene la ruta por defecto para el nuevo tenant
   * 4. Navega a la nueva ruta
   */
  const handleTenantChange = async (tenantId: string) => {
    if (tenantId === activeTenant?.id || isSwitching) return;

    const success = await switchTenant(tenantId);

    if (success) {
      // Actualizar el contexto local con el nuevo tenant
      await refreshTenant();

      // Obtener la ruta por defecto para el nuevo tenant
      const { route: defaultRoute } =
        await getDefaultRouteForTenantAction(tenantId);

      // Navegar a la ruta por defecto del nuevo tenant
      router.replace(defaultRoute);
      router.refresh();
    }
  };

  // Estado de carga
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Skeleton className="size-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Si no hay tenant activo (puede ser un super admin sin tenant seleccionado)
  if (!activeTenant) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <HugeiconsIcon
                icon={Building}
                strokeWidth={2}
                className="size-4"
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-muted-foreground">
                Sin empresa
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Selecciona una empresa
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Si solo tiene un tenant, mostrar sin dropdown
  if (tenants.length <= 1) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <HugeiconsIcon
                icon={Building}
                strokeWidth={2}
                className="size-4"
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeTenant.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                Empresa activa
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Múltiples tenants: mostrar dropdown para cambiar
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isSwitching}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <HugeiconsIcon
                  icon={Building}
                  strokeWidth={2}
                  className="size-4"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeTenant.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {isSwitching ? "Cambiando..." : "Empresa activa"}
                </span>
              </div>
              <HugeiconsIcon icon={ChevronsUpDown} className="size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Cambiar empresa
            </DropdownMenuLabel>
            {tenants.map((tenantItem) => (
              <DropdownMenuItem
                key={tenantItem.id}
                onClick={() => handleTenantChange(tenantItem.id)}
                className="gap-2 p-2"
                disabled={tenantItem.id === activeTenant.id || isSwitching}
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <HugeiconsIcon
                    icon={Building}
                    strokeWidth={2}
                    className="size-3.5 shrink-0"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <span
                    className={
                      tenantItem.id === activeTenant.id ? "font-medium" : ""
                    }
                  >
                    {tenantItem.name}
                  </span>
                  {tenantItem.roles && tenantItem.roles.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {tenantItem.roles.map((r) => r.name).join(", ")}
                    </span>
                  )}
                </div>
                {tenantItem.id === activeTenant.id && (
                  <span className="text-xs text-primary">●</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
