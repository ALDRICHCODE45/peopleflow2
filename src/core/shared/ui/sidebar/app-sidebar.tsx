"use client";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@shadcn/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { sidebarLinks } from "./data/sidebarLinks";
import { useAuth } from "../../hooks/use-auth";
import { usePermissions } from "../../hooks";
import { filterSidebarLinks } from "../../helpers/sidebar-filter";
import { TeamSwitcher } from "./TeamSwitcher";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const { permissions } = usePermissions();

  const userData = user
    ? {
        name: user.name || "Usuario",
        email: user.email || "usuario@bdp.com",
        avatar: user.image ?? "",
      }
    : {
        name: "Usuario",
        email: "usuario@bdp.com",
        avatar: "",
      };

  // Filtrar los links del sidebar basándose en los permisos del usuario
  const filteredLinks = React.useMemo(() => {
    return filterSidebarLinks(sidebarLinks.navMain, permissions);
  }, [permissions]);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      variant="floating"
      className="rounded-full"
    >
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredLinks} />
      </SidebarContent>

      <SidebarRail />

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
