import { PrismaClient } from "../src/core/generated/prisma/client";
import {
  ALL_PERMISSIONS,
  SUPER_ADMIN_PERMISSION_NAME,
} from "../src/core/shared/constants/permissions";

/**
 * Seed de permisos del sistema
 *
 * Crea todos los permisos definidos en el sistema de permisos.
 * Este archivo puede ser importado desde seed.ts o ejecutado independientemente.
 */

export async function seedPermissions(prisma: PrismaClient) {
  console.log("📋 Creando permisos del sistema...");

  // Crear todos los permisos definidos
  for (const permission of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
      },
      create: {
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
      },
    });
  }

  console.log(`✅ ${ALL_PERMISSIONS.length} permisos creados/actualizados`);

  return ALL_PERMISSIONS;
}

/**
 * Obtiene el permiso de super:admin de la base de datos
 */
export async function getSuperAdminPermission(prisma: PrismaClient) {
  return prisma.permission.findUnique({
    where: { name: SUPER_ADMIN_PERMISSION_NAME },
  });
}

/**
 * Crea roles básicos del sistema con sus permisos
 */
export async function seedRoles(prisma: PrismaClient) {
  console.log("👥 Creando roles del sistema...");

  // Rol: Administrador (tiene super:admin)
  const adminRole = await prisma.role.upsert({
    where: { name: "administrador" },
    update: {},
    create: { name: "administrador" },
  });

  // Rol: Gerente Finanzas
  const gerenteFinanzasRole = await prisma.role.upsert({
    where: { name: "gerente-finanzas" },
    update: {},
    create: { name: "gerente-finanzas" },
  });

  // Rol: Gerente Reclutamiento
  const gerenteReclutamientoRole = await prisma.role.upsert({
    where: { name: "gerente-reclutamiento" },
    update: {},
    create: { name: "gerente-reclutamiento" },
  });

  // Rol: Gerente Ventas
  const gerenteVentasRole = await prisma.role.upsert({
    where: { name: "gerente-ventas" },
    update: {},
    create: { name: "gerente-ventas" },
  });

  // Rol: Capturador (permisos básicos de lectura)
  const capturadorRole = await prisma.role.upsert({
    where: { name: "capturador" },
    update: {},
    create: { name: "capturador" },
  });

  console.log("✅ Roles creados/actualizados");

  // Asignar permisos a roles
  console.log("🔗 Asignando permisos a roles...");

  // Obtener todos los permisos de la BD
  const allDbPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allDbPermissions.map((p) => [p.name, p.id]));

  // Función helper para asignar permisos a un rol
  async function assignPermissionsToRole(
    roleId: string,
    permissionNames: string[]
  ) {
    for (const permName of permissionNames) {
      const permissionId = permissionMap.get(permName);
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId },
          },
          update: {},
          create: { roleId, permissionId },
        });
      }
    }
  }

  // Administrador: super:admin (acceso total)
  await assignPermissionsToRole(adminRole.id, ["super:admin"]);

  // Gerente Finanzas: gestionar todo el módulo de finanzas
  await assignPermissionsToRole(gerenteFinanzasRole.id, [
    "ingresos:gestionar",
    "egresos:gestionar",
  ]);

  // Gerente Reclutamiento: gestionar todo el módulo de reclutamiento
  await assignPermissionsToRole(gerenteReclutamientoRole.id, [
    "vacantes:gestionar",
    "candidatos:gestionar",
    "reportes-reclutamiento:gestionar",
  ]);

  // Gerente Ventas: gestionar todo el módulo de ventas
  await assignPermissionsToRole(gerenteVentasRole.id, [
    "leads:gestionar",
    "reportes-ventas:gestionar",
  ]);

  // Capturador: solo acceder y crear en módulos básicos
  await assignPermissionsToRole(capturadorRole.id, [
    "ingresos:acceder",
    "ingresos:crear",
    "egresos:acceder",
    "egresos:crear",
    "leads:acceder",
    "leads:crear",
  ]);

  console.log("✅ Permisos asignados a roles");

  return {
    adminRole,
    gerenteFinanzasRole,
    gerenteReclutamientoRole,
    gerenteVentasRole,
    capturadorRole,
  };
}

/**
 * Crea tenants de ejemplo
 */
export async function seedTenants(prisma: PrismaClient) {
  console.log("🏢 Creando tenants de ejemplo...");

  const tenantA = await prisma.tenant.upsert({
    where: { slug: "trust-people" },
    update: {},
    create: {
      name: "Trust People",
      slug: "trust-people",
    },
  });

  const tenantB = await prisma.tenant.upsert({
    where: { slug: "relevant" },
    update: {},
    create: {
      name: "Relevant",
      slug: "relevant",
    },
  });

  console.log("✅ Tenants creados/actualizados");

  return { tenantA, tenantB };
}
