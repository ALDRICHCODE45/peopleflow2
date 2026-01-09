import { auth } from "@/core/lib/auth";
import { headers } from "next/headers";
import prisma from "@/core/lib/prisma";
import { redirect } from "next/navigation";
import { SuperAdminDashboard } from "@/features/super-admin/frontend/pages/SuperAdminDashboard";

/**
 * Página principal del Super Admin
 *
 * Muestra:
 * - Lista de todos los tenants
 * - Estadísticas del sistema
 * - Acciones de administración global
 */
export default async function SuperAdminPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return redirect("/sign-in");
  }

  // Obtener todos los tenants
  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: {
          userRoles: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Obtener estadísticas
  const stats = {
    totalTenants: tenants.length,
    totalUsers: await prisma.user.count(),
    totalRoles: await prisma.role.count(),
    totalPermissions: await prisma.permission.count(),
  };

  return (
    <SuperAdminDashboard
      tenants={tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        userCount: t._count.userRoles,
        createdAt: t.createdAt.toISOString(),
      }))}
      stats={stats}
      currentUser={{
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || null,
      }}
    />
  );
}
