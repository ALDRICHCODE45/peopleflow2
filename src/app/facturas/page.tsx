import { TenantProvider } from '@/features/Tenants/context/TenantContext';
import { TenantSwitcher } from '@/features/Tenants/components/TenantSwitcher';
import { PermissionGate } from '@/features/Permissions/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn/card';
import { Button } from '@shadcn/button';
import { auth } from '@lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { checkPermissionAction } from '@/app/actions/permissions';
import { getCurrentTenantAction } from '@/app/actions/tenants';
import { headers } from 'next/headers';

export default async function FacturasPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect('/');
  }

  const tenantResult = await getCurrentTenantAction();
  const tenant = tenantResult.tenant;

  // Verificar permisos
  const hasAccessPermission = await checkPermissionAction('facturas:acceder', tenant?.id || null);
  const hasCreatePermission = await checkPermissionAction('facturas:crear', tenant?.id || null);

  if (!hasAccessPermission && !hasCreatePermission) {
    return (
      <TenantProvider>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Denegado</CardTitle>
              <CardDescription>No tienes permisos para acceder a esta sección</CardDescription>
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
            <h1 className="text-3xl font-bold">Facturas</h1>
            <p className="text-muted-foreground">
              {tenant ? `Tenant: ${tenant.name}` : 'Sin tenant seleccionado'}
            </p>
          </div>
          <div className="flex gap-2">
            <TenantSwitcher />
            <Link href="/dashboard">
              <Button variant="outline">Volver</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Facturas</CardTitle>
            <CardDescription>
              Demostración de permisos para el rol "capturador"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Permisos del Rol "Capturador":</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>facturas:acceder - Puede ver esta página</li>
                <li>facturas:crear - Puede crear nuevas facturas</li>
              </ul>
            </div>

            <PermissionGate permission="facturas:acceder" fallback={<p className="text-destructive">No tienes permiso para acceder</p>}>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Lista de Facturas</h3>
                  <p className="text-sm text-muted-foreground">
                    Aquí se mostrarían las facturas (ejemplo básico)
                  </p>
                </div>

                <PermissionGate 
                  permission="facturas:crear" 
                  fallback={
                    <p className="text-sm text-muted-foreground">
                      No tienes permiso para crear facturas
                    </p>
                  }
                >
                  <Button>Crear Nueva Factura</Button>
                </PermissionGate>
              </div>
            </PermissionGate>
          </CardContent>
        </Card>
      </div>
    </TenantProvider>
  );
}
