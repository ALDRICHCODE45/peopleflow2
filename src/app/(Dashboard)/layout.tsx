import { AuthGuard } from "@/core/shared/components/AuthGuard";
import { RouteGuard } from "@/core/shared/components/RouteGuard";
import { ThemeToogle } from "@/core/shared/components/ThemeToogle";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/core/shared/ui/shadcn/sidebar";
import { AppSidebar } from "@/core/shared/ui/sidebar/app-sidebar";
import { BreadcrumbNavbar } from "@/core/shared/ui/sidebar/BreadCrumNavbar";
import { TenantProvider } from "@/features/tenants/frontend/context/TenantContext";
import { ThemeProvider } from "next-themes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <AuthGuard>
        <TenantProvider>
          <RouteGuard>
            <SidebarProvider defaultOpen={false}>
              <AppSidebar />
              <SidebarInset className="flex flex-col min-h-screen w-full min-w-0">
                <header className="sticky bg-white dark:bg-background top-0 z-50 flex justify-between w-full h-16 shrink-0 items-center gap-2 border-b min-w-0">
                  <div className="flex items-center gap-2 px-4 min-w-0 flex-1">
                    <SidebarTrigger className="-ml-1 shrink" />
                    <Separator
                      orientation="vertical"
                      className="mr-2 data-[orientation=vertical]:h-4 shrink"
                    />
                    <div className="min-w-0 flex-1">
                      <BreadcrumbNavbar />
                    </div>
                  </div>
                  <div className="mr-4 sm:mr-6 md:mr-8 lg:mr-10 shrink">
                    <ThemeToogle />
                  </div>
                </header>
                <div className="flex-1 pt-4 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 min-w-0 w-full">
                  <div className="w-full max-w-full min-w-0 overflow-hidden">
                    {children}
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </RouteGuard>
        </TenantProvider>
      </AuthGuard>
    </ThemeProvider>
  );
}
