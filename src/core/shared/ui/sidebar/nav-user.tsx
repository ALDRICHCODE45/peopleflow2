"use client";
import { AccessIcon, Grid } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shadcn/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@shadcn/sidebar";
import { useAuth } from "@/core/shared/hooks/use-auth";
import { Button, buttonVariants } from "@shadcn/button";
import { ConfirmDialog } from "../../components/confirmDialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PermissionActions } from "../../constants/permissions";
import Link from "next/link";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { logout } = useAuth();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    setTheme("light");
    await logout();
  };

  const twoFirstNameLetters = user.name.slice(0, 2);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name.toUpperCase()} />
                <AvatarFallback className="rounded-lg">
                  {twoFirstNameLetters.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.name.toUpperCase()}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <HugeiconsIcon icon={AccessIcon} strokeWidth={2} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">BA</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <ConfirmDialog
                  title="Cerrar Sesión"
                  description="¿Estás seguro de que deseas salir de la aplicación? Tendrás que iniciar sesión nuevamente."
                  action={handleLogout}
                  trigger={
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                    >
                      <HugeiconsIcon icon={AccessIcon} strokeWidth={2} />
                      Salir
                    </Button>
                  }
                  confirmText="Sí, salir"
                  cancelText="Cancelar"
                  variant="destructive"
                />
              </DropdownMenuItem>

              <PermissionGuard permissions={[PermissionActions.super.admin]}>
                <DropdownMenuItem asChild>
                  <Link
                    href={"/super-admin"}
                    className={`${buttonVariants({ variant: "secondary" })} w-full flex justify-start`}
                  >
                    <HugeiconsIcon icon={Grid} strokeWidth={2} />
                    Super Dashboard
                  </Link>
                </DropdownMenuItem>
              </PermissionGuard>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
