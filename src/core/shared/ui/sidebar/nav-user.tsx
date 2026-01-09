"use client";
import { AccessIcon } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { Button } from "@shadcn/button";
import { ConfirmDialog } from "../../components/confirmDialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";

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
  const { setTheme, theme } = useTheme();

  const handleLogout = async () => {
    setTheme("light");
    await logout();
    console.log({ theme });
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
            <DropdownMenuSeparator />

            <ConfirmDialog
              title="Cerrar Sesión"
              description="¿Estás seguro de que deseas salir de la aplicación? Tendrás que iniciar sesión nuevamente."
              action={handleLogout}
              trigger={
                <Button variant="destructive" className="w-full justify-start">
                  <HugeiconsIcon icon={AccessIcon} strokeWidth={2} />
                  Salir
                </Button>
              }
              confirmText="Sí, salir"
              cancelText="Cancelar"
              variant="destructive"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
