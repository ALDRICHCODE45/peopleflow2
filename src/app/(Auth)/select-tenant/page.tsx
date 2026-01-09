import { redirect } from "next/navigation";
import { auth } from "@/core/lib/auth";
import { headers } from "next/headers";
import prisma from "@/core/lib/prisma";
import { SelectTenantPage } from "@/features/tenants/frontend/pages/SelectTenantPage";
import { getDefaultRoute } from "@/core/lib/permissions/get-default-route";

/**
 * Página de selección de tenant
 *
 * Se muestra cuando un usuario tiene acceso a múltiples tenants
 * y necesita seleccionar con cuál trabajar.
 */
export default async function SelectTenant() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // Verificar autenticación
  if (!session?.user) {
    return redirect("/sign-in");
  }

  // Obtener tenants del usuario
  const userRoles = await prisma.userRole.findMany({
    where: { userId: session.user.id },
    include: {
      tenant: true,
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  // Obtener tenants únicos
  const tenantsMap = new Map<
    string,
    { id: string; name: string; slug: string; roles: string[] }
  >();

  for (const userRole of userRoles) {
    if (userRole.tenant) {
      const existing = tenantsMap.get(userRole.tenant.id);
      if (existing) {
        existing.roles.push(userRole.role.name);
      } else {
        tenantsMap.set(userRole.tenant.id, {
          id: userRole.tenant.id,
          name: userRole.tenant.name,
          slug: userRole.tenant.slug,
          roles: [userRole.role.name],
        });
      }
    }
  }

  const tenants = Array.from(tenantsMap.values());

  // Si no tiene tenants, redirigir a acceso denegado
  if (tenants.length === 0) {
    return redirect("/access-denied");
  }

  // Si solo tiene un tenant, seleccionarlo automáticamente y redirigir
  if (tenants.length === 1) {
    // Actualizar sesión con el tenant
    if (session.session?.token) {
      await prisma.session.update({
        where: { token: session.session.token },
        data: { activeTenantId: tenants[0].id },
      });
    }

    // Obtener permisos para determinar ruta
    const permissionSet = new Set<string>();
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        permissionSet.add(rolePermission.permission.name);
      }
    }

    const defaultRoute = getDefaultRoute(Array.from(permissionSet));
    return redirect(defaultRoute);
  }

  // Mostrar selector de tenant
  return (
    <SelectTenantPage
      tenants={tenants}
      userName={session.user.name || session.user.email}
    />
  );
}
