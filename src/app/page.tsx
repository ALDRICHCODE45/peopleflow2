import { redirect } from "next/navigation";
import { Routes } from "@core/shared/constants/routes";
import prisma from "@/core/lib/prisma";
import { getDefaultRoute } from "@/core/lib/permissions/get-default-route";
import { getSessionOtpStatus } from "@core/lib/session-otp";
import { prismaUserRoleRepository } from "@/features/auth-rbac/server/infrastructure/repositories/PrismaUserRoleRepository";

/**
 * Página raíz - Maneja la redirección basada en autenticación y permisos
 *
 * Flujo:
 * 1. Si no está autenticado → /sign-in
 * 2. Si email no verificado → /verify-otp
 * 3. Si es super:admin → /super-admin
 * 4. Si tiene múltiples tenants sin seleccionar → /select-tenant
 * 5. Si tiene un solo tenant o ya seleccionó → ruta según permisos
 *
 * IMPORTANTE: Los permisos se obtienen SOLO del tenant activo para evitar
 * permission leakage entre tenants (fix de bug de seguridad).
 */
export default async function HomePage() {
  const { session, isLoggedIn, otpVerified } = await getSessionOtpStatus();

  // 1. Si no hay sesión, redirigir a sign-in
  if (!isLoggedIn || !session?.user) {
    return redirect(Routes.signIn);
  }

  // 2. Si la sesión no completó el OTP, redirigir a verificación.
  //    Verificamos otpVerifiedAt POR SESIÓN (vía getSessionOtpStatus), no
  //    emailVerified del User: ese flag es permanente tras el primer OTP y
  //    dejaba pasar sesiones OTP-pendientes, causando un loop de redirección.
  if (!otpVerified) {
    return redirect(Routes.verifyOtp);
  }

  const userId = session.user.id;

  // 2. Verificar primero si es SuperAdmin (tienen rol global sin tenant)
  const isSuperAdmin = await prismaUserRoleRepository.isSuperAdmin(userId);
  if (isSuperAdmin) {
    return redirect(Routes.superAdmin);
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
    return redirect(Routes.accessDenied);
  }

  // 6. Si tiene múltiples tenants y no ha seleccionado, redirigir a select-tenant
  if (userTenants.length > 1 && !activeTenantId) {
    return redirect(Routes.selectTenant);
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
