import { redirect } from "next/navigation";
import { auth } from "@/core/lib/auth";
import { headers } from "next/headers";
import prisma from "@/core/lib/prisma";
import { getDefaultRoute } from "@/core/lib/permissions/get-default-route";
import { prismaUserRoleRepository } from "@/features/auth-rbac/server/infrastructure/repositories/PrismaUserRoleRepository";

/**
 * Página raíz - Maneja la redirección basada en autenticación y permisos
 *
 * Flujo:
 * 1. Si no está autenticado → /sign-in
 * 2. Si es super:admin → /super-admin
 * 3. Si tiene múltiples tenants sin seleccionar → /select-tenant
 * 4. Si tiene un solo tenant o ya seleccionó → ruta según permisos
 *
 * IMPORTANTE: Los permisos se obtienen SOLO del tenant activo para evitar
 * permission leakage entre tenants (fix de bug de seguridad).
 */
export default async function HomePage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // 1. Si no hay sesión, redirigir a sign-in
  if (!session?.user) {
    return redirect("/sign-in");
  }

  const userId = session.user.id;

  // 2. Verificar primero si es SuperAdmin (tienen rol global sin tenant)
  const isSuperAdmin = await prismaUserRoleRepository.isSuperAdmin(userId);
  if (isSuperAdmin) {
    return redirect("/super-admin");
  }

  // 3. Para usuarios normales: obtener tenant activo y roles en paralelo
  const [dbSession, userRoles] = await Promise.all([
    prisma.session.findFirst({
      where: { userId, token: session.session?.token },
      select: { activeTenantId: true },
    }),
    prisma.userRole.findMany({
      where: { userId },
      include: { tenant: true },
    }),
  ]);

  let activeTenantId = dbSession?.activeTenantId || null;

  // 4. Obtener tenants únicos del usuario
  const userTenants = userRoles
    .filter((ur) => ur.tenant !== null)
    .map((ur) => ur.tenant!)
    .filter(
      (tenant, index, self) =>
        self.findIndex((t) => t.id === tenant.id) === index,
    );

  // 5. Si no tiene tenants, redirigir a acceso denegado
  if (userTenants.length === 0) {
    return redirect("/access-denied");
  }

  // 6. Si tiene múltiples tenants y no ha seleccionado, redirigir a select-tenant
  if (userTenants.length > 1 && !activeTenantId) {
    return redirect("/select-tenant");
  }

  // 7. Si tiene un solo tenant, establecerlo como activo si no lo está
  if (userTenants.length === 1 && session.session?.token && !activeTenantId) {
    await prisma.session.update({
      where: { token: session.session.token },
      data: { activeTenantId: userTenants[0].id },
    });
    activeTenantId = userTenants[0].id;
  }

  // 8. Obtener permisos filtrados por tenant activo usando el repositorio seguro
  const userPermissions = await prismaUserRoleRepository.getUserPermissions(
    userId,
    activeTenantId,
  );

  // 9. Redirigir a la ruta por defecto según permisos
  const defaultRoute = getDefaultRoute(userPermissions);
  return redirect(defaultRoute);
}
