import prisma from "./prisma";

/**
 * Utilidades para gestionar tenants y roles de usuarios
 */

/**
 * Obtiene todos los tenants a los que pertenece un usuario
 * @param userId - ID del usuario
 * @returns Array de tenants con sus roles asociados
 */
export async function getUserTenants(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      tenantId: { not: null }, // Excluir roles sin tenant (superadmin global)
    },
    include: {
      tenant: true,
      role: true,
    },
  });

  // Agrupar por tenant y obtener roles únicos
  const tenantMap = new Map();
  
  for (const userRole of userRoles) {
    if (!userRole.tenant) continue;
    
    const tenantId = userRole.tenant.id;
    if (!tenantMap.has(tenantId)) {
      tenantMap.set(tenantId, {
        ...userRole.tenant,
        roles: [],
      });
    }
    
    tenantMap.get(tenantId).roles.push(userRole.role);
  }

  return Array.from(tenantMap.values());
}

/**
 * Obtiene el rol de un usuario en un tenant específico
 * @param userId - ID del usuario
 * @param tenantId - ID del tenant
 * @returns El rol del usuario en el tenant, o null si no pertenece
 */
export async function getUserRoleInTenant(userId: string, tenantId: string | null) {
  if (!tenantId) {
    // Si no hay tenantId, verificar si es superadmin global
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' },
    });

    if (superAdminRole) {
      const userRole = await prisma.userRole.findFirst({
        where: {
          userId,
          roleId: superAdminRole.id,
          tenantId: null,
        },
        include: {
          role: true,
        },
      });

      return userRole?.role || null;
    }

    return null;
  }

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      tenantId,
    },
    include: {
      role: true,
    },
  });

  return userRole?.role || null;
}

/**
 * Verifica si un usuario puede acceder a un tenant
 * Superadmin puede acceder a todos los tenants
 * @param userId - ID del usuario
 * @param tenantId - ID del tenant (null para acceso global)
 * @returns true si puede acceder, false en caso contrario
 */
export async function canAccessTenant(userId: string, tenantId: string | null): Promise<boolean> {
  // Superadmin puede acceder a todo
  if (await isSuperAdmin(userId)) {
    return true;
  }

  // Si no hay tenantId, solo superadmin puede acceder
  if (!tenantId) {
    return false;
  }

  // Verificar si el usuario pertenece al tenant
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      tenantId,
    },
  });

  return !!userRole;
}

/**
 * Verifica si un usuario es superadmin
 * @param userId - ID del usuario
 * @returns true si es superadmin, false en caso contrario
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'superadmin' },
  });

  if (!superAdminRole) {
    return false;
  }

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId: superAdminRole.id,
    },
  });

  return !!userRole;
}

/**
 * Cambia el tenant activo en la sesión
 * @param sessionToken - Token de la sesión
 * @param tenantId - ID del tenant a activar (null para limpiar)
 * @returns true si se actualizó correctamente, false en caso contrario
 */
export async function switchTenant(sessionToken: string, tenantId: string | null): Promise<boolean> {
  try {
    await prisma.session.update({
      where: { token: sessionToken },
      data: { activeTenantId: tenantId },
    });
    return true;
  } catch (error) {
    console.error('Error switching tenant:', error);
    return false;
  }
}

/**
 * Obtiene el tenant activo de la sesión actual
 * @param sessionToken - Token de la sesión
 * @returns El tenant activo o null
 */
export async function getActiveTenant(sessionToken: string) {
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      activeTenant: true,
    },
  });

  return session?.activeTenant || null;
}

