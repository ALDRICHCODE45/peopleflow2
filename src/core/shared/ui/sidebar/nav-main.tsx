"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shadcn/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@shadcn/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarItem } from "@/core/shared/helpers/sidebar-filter";

// Helper functions para verificar rutas activas
function isParentActive(
  pathname: string,
  item: { url: string; items?: { url: string }[] }
): boolean {
  if (item.items) {
    return item.items.some((subItem) => isSubItemActive(pathname, subItem.url));
  }
  return pathname === item.url || pathname.startsWith(item.url + "/");
}

function isSubItemActive(pathname: string, url: string): boolean {
  if (pathname === url) {
    return true;
  }
  if (pathname.startsWith(url + "/")) {
    return true;
  }
  return false;
}

export function NavMain({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Módulos</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = isParentActive(pathname, item);

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="cursor-pointer"
                  >
                    {item.icon && (
                      <HugeiconsIcon
                        icon={item.icon}
                        strokeWidth={2}
                        className="text-gray-500"
                      />
                    )}
                    <span>{item.title}</span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubActive = isSubItemActive(
                        pathname,
                        subItem.url
                      );

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link
                              href={subItem.url}
                              className={isSubActive ? "bg-accent" : ""}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
