import { TenantProvider } from "../context/TenantContext";
import { TenantSwitcher } from "../components/TenantSwitcher";
import { TenantList } from "../components/TenantList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/card";
import { auth } from "@lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@shadcn/button";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect("/");
  }

  return (
    <TenantProvider>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bienvenido, {session.user.name || session.user.email}
            </p>
          </div>
          <TenantSwitcher />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TenantList />

          <Card>
            <CardHeader>
              <CardTitle>Navegación</CardTitle>
              <CardDescription>Acceso rápido a las secciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/facturas">
                <Button variant="outline" className="w-full justify-start">
                  Facturas
                </Button>
              </Link>
              <Link href="/colaboradores">
                <Button variant="outline" className="w-full justify-start">
                  Colaboradores
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" className="w-full justify-start">
                  Administración
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </TenantProvider>
  );
}
