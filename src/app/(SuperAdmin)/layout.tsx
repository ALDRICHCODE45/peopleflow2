import { redirect } from "next/navigation";
import { auth } from "@/core/lib/auth";
import { headers } from "next/headers";
import prisma from "@/core/lib/prisma";
import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";
import { ThemeToogle } from "@/core/shared/components/ThemeToogle";

/**
 * Layout para el área de Super Admin
 *
 * Verifica que el usuario tenga el permiso super:admin
 * antes de permitir acceso a las rutas hijas.
 */
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // Verificar autenticación
  if (!session?.user) {
    return redirect("/sign-in");
  }

  // Verificar que tenga permiso super:admin
  const userRoles = await prisma.userRole.findMany({
    where: { userId: session.user.id },
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
    },
  });

  // Extraer permisos
  const permissionSet = new Set<string>();
  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.permissions) {
      permissionSet.add(rolePermission.permission.name);
    }
  }

  // Verificar super:admin
  if (!permissionSet.has(SUPER_ADMIN_PERMISSION_NAME)) {
    return redirect("/access-denied");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Panel Super Admin
              </h1>
              <p className="text-xs text-purple-300">PeopleFlow</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-purple-200">
              {session.user.email}
            </span>
            <ThemeToogle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
