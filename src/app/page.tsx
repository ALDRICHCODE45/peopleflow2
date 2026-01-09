import { redirect } from "next/navigation";
import { auth } from "@/core/lib/auth";
import { headers } from "next/headers";
import prisma from "@/core/lib/prisma";
import { getDefaultRoute } from "@/core/lib/permissions/get-default-route";
import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";

/**
 * Página raíz - Maneja la redirección basada en autenticación y permisos
 *
 * Flujo:
 * 1. Si no está autenticado → /sign-in
 * 2. Si es super:admin → /super-admin
 * 3. Si tiene múltiples tenants sin seleccionar → /select-tenant
 * 4. Si tiene un solo tenant o ya seleccionó → ruta según permisos
 */
export default async function HomePage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // 1. Si no hay sesión, redirigir a sign-in
  if (!session?.user) {
    return redirect("/sign-in");
  }

  const userId = session.user.id;

  // 2. Obtener roles y permisos del usuario
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      tenant: true,
    },
  });

  // Extraer permisos únicos
  const permissionSet = new Set<string>();
  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.permissions) {
      permissionSet.add(rolePermission.permission.name);
    }
  }
  const userPermissions = Array.from(permissionSet);

  // 3. Si tiene permiso super:admin, redirigir al dashboard de super admin
  if (userPermissions.includes(SUPER_ADMIN_PERMISSION_NAME)) {
    return redirect("/super-admin");
  }

  // 4. Obtener tenants únicos del usuario
  const userTenants = userRoles
    .filter((ur) => ur.tenant !== null)
    .map((ur) => ur.tenant!)
    .filter(
      (tenant, index, self) =>
        self.findIndex((t) => t.id === tenant.id) === index
    );

  // 5. Si tiene múltiples tenants, verificar si ya seleccionó uno
  if (userTenants.length > 1) {
    // Buscar la sesión en la BD para obtener el tenant activo
    const dbSession = await prisma.session.findFirst({
      where: {
        userId,
        token: session.session?.token,
      },
      select: {
        activeTenantId: true,
      },
    });

    if (!dbSession?.activeTenantId) {
      return redirect("/select-tenant");
    }
  }

  // 6. Si tiene un solo tenant, establecerlo como activo si no lo está
  if (userTenants.length === 1 && session.session?.token) {
    // Verificar si ya tiene tenant activo
    const dbSession = await prisma.session.findFirst({
      where: {
        token: session.session.token,
      },
      select: {
        activeTenantId: true,
      },
    });

    if (!dbSession?.activeTenantId) {
      // Actualizar la sesión con el tenant activo
      await prisma.session.update({
        where: { token: session.session.token },
        data: { activeTenantId: userTenants[0].id },
      });
    }
  }

  // 7. Si no tiene tenants, redirigir a acceso denegado
  if (userTenants.length === 0) {
    return redirect("/access-denied");
  }

  // 8. Redirigir a la ruta por defecto según permisos
  const defaultRoute = getDefaultRoute(userPermissions);
  return redirect(defaultRoute);
}
