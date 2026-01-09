import { TenantProvider } from "@/features/tenants/frontend/context/TenantContext";
import { TenantSwitcher } from "@/features/tenants/frontend/components/TenantSwitcher";
import { CreateTenantForm } from "@/features/tenants/frontend/components/CreateTenantForm";
import { CreateUserForm } from "../components/CreateUserForm";
import { AssignUserToTenantForm } from "../components/AssignUserToTenantForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/card";
import { Button } from "@shadcn/button";
import { auth } from "@lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { prismaUserRoleRepository } from "../../server/infrastructure/repositories/PrismaUserRoleRepository";

export default async function AdminPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect("/");
  }

  // Verificar que sea superadmin
  const userIsSuperAdmin = await prismaUserRoleRepository.isSuperAdmin(
    session.user.id
  );

  if (!userIsSuperAdmin) {
    return (
      <TenantProvider>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Denegado</CardTitle>
              <CardDescription>
                Esta página es solo para superadministradores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button>Volver al Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </TenantProvider>
    );
  }

  return (
    <TenantProvider>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administración</h1>
            <p className="text-muted-foreground">Panel de superadministrador</p>
          </div>
          <div className="flex gap-2">
            <TenantSwitcher />
            <Link href="/dashboard">
              <Button variant="outline">Volver</Button>
            </Link>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Permisos del Rol "Superadmin":</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Puede crear tenants (empresas)</li>
            <li>Puede crear usuarios</li>
            <li>Puede asignar usuarios a tenants con roles específicos</li>
            <li>Puede acceder a cualquier tenant</li>
            <li>Acceso total a todas las funcionalidades</li>
          </ul>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CreateTenantForm />
          <CreateUserForm />
          <AssignUserToTenantForm />
        </div>
      </div>
    </TenantProvider>
  );
}
