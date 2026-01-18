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
 * Los roles se crean por tenant (excepto administrador que es global)
 */
export async function seedRoles(
  prisma: PrismaClient,
  tenantA: { id: string },
  tenantB: { id: string }
) {
  console.log("👥 Creando roles del sistema...");

  // Rol global: Administrador (tiene super:admin, tenantId = null)
  // Para roles globales usamos findFirst + create ya que Prisma no soporta null en compound unique where
  let adminRole = await prisma.role.findFirst({
    where: { name: "administrador", tenantId: null },
  });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: "administrador", tenantId: null },
    });
  }

  // Roles para Tenant A
  const gerenteFinanzasRoleA = await prisma.role.upsert({
    where: { name_tenantId: { name: "gerente-finanzas", tenantId: tenantA.id } },
    update: {},
    create: { name: "gerente-finanzas", tenantId: tenantA.id },
  });

  const gerenteReclutamientoRoleA = await prisma.role.upsert({
    where: { name_tenantId: { name: "gerente-reclutamiento", tenantId: tenantA.id } },
    update: {},
    create: { name: "gerente-reclutamiento", tenantId: tenantA.id },
  });

  const gerenteVentasRoleA = await prisma.role.upsert({
    where: { name_tenantId: { name: "gerente-ventas", tenantId: tenantA.id } },
    update: {},
    create: { name: "gerente-ventas", tenantId: tenantA.id },
  });

  const capturadorRoleA = await prisma.role.upsert({
    where: { name_tenantId: { name: "capturador", tenantId: tenantA.id } },
    update: {},
    create: { name: "capturador", tenantId: tenantA.id },
  });

  // Roles para Tenant B
  const gerenteFinanzasRoleB = await prisma.role.upsert({
    where: { name_tenantId: { name: "gerente-finanzas", tenantId: tenantB.id } },
    update: {},
    create: { name: "gerente-finanzas", tenantId: tenantB.id },
  });

  const gerenteReclutamientoRoleB = await prisma.role.upsert({
    where: { name_tenantId: { name: "gerente-reclutamiento", tenantId: tenantB.id } },
    update: {},
    create: { name: "gerente-reclutamiento", tenantId: tenantB.id },
  });

  const gerenteVentasRoleB = await prisma.role.upsert({
    where: { name_tenantId: { name: "gerente-ventas", tenantId: tenantB.id } },
    update: {},
    create: { name: "gerente-ventas", tenantId: tenantB.id },
  });

  const capturadorRoleB = await prisma.role.upsert({
    where: { name_tenantId: { name: "capturador", tenantId: tenantB.id } },
    update: {},
    create: { name: "capturador", tenantId: tenantB.id },
  });

  console.log("✅ Roles creados/actualizados (globales y por tenant)");

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

  // Administrador: super:admin (acceso total) - Rol global
  await assignPermissionsToRole(adminRole.id, ["super:admin"]);

  // Permisos para roles del Tenant A
  await assignPermissionsToRole(gerenteFinanzasRoleA.id, [
    "ingresos:gestionar",
    "egresos:gestionar",
  ]);
  await assignPermissionsToRole(gerenteReclutamientoRoleA.id, [
    "vacantes:gestionar",
    "candidatos:gestionar",
    "reportes-reclutamiento:gestionar",
  ]);
  await assignPermissionsToRole(gerenteVentasRoleA.id, [
    "leads:gestionar",
    "reportes-ventas:gestionar",
  ]);
  await assignPermissionsToRole(capturadorRoleA.id, [
    "ingresos:acceder",
    "ingresos:crear",
    "egresos:acceder",
    "egresos:crear",
    "leads:acceder",
    "leads:crear",
  ]);

  // Permisos para roles del Tenant B
  await assignPermissionsToRole(gerenteFinanzasRoleB.id, [
    "ingresos:gestionar",
    "egresos:gestionar",
  ]);
  await assignPermissionsToRole(gerenteReclutamientoRoleB.id, [
    "vacantes:gestionar",
    "candidatos:gestionar",
    "reportes-reclutamiento:gestionar",
  ]);
  await assignPermissionsToRole(gerenteVentasRoleB.id, [
    "leads:gestionar",
    "reportes-ventas:gestionar",
  ]);
  await assignPermissionsToRole(capturadorRoleB.id, [
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
    // Roles Tenant A
    gerenteFinanzasRoleA,
    gerenteReclutamientoRoleA,
    gerenteVentasRoleA,
    capturadorRoleA,
    // Roles Tenant B
    gerenteFinanzasRoleB,
    gerenteReclutamientoRoleB,
    gerenteVentasRoleB,
    capturadorRoleB,
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
