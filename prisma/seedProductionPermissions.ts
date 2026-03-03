/**
 * seedProductionPermissions.ts
 *
 * Script seguro para producción:
 * - Upsert de TODOS los permisos del sistema (nunca elimina)
 * - Garantiza que el rol global "administrador" exista
 * - Garantiza que "super:admin" esté asignado al rol "administrador"
 * - Garantiza que el usuario super admin tenga el rol "administrador" (global, tenantId = null)
 *
 * Uso:
 *   bunx tsx prisma/seedProductionPermissions.ts
 *
 * En producción (Vercel / servidor):
 *   DATABASE_URL=<url_produccion> bunx tsx prisma/seedProductionPermissions.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/core/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { ALL_PERMISSIONS } from "../src/core/shared/constants/permissions";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL no está configurado. Configura DATABASE_URL en tu .env"
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Configura aquí el email del super admin de producción ───────────────────
const SUPER_ADMIN_EMAIL = "aldrich@aldrichcode.dev";
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 PeopleFlow2 — Seed de Permisos para Producción");
  console.log("=".repeat(55));
  console.log("⚠️  Este script NUNCA elimina datos existentes.");
  console.log("    Solo inserta o actualiza lo necesario.\n");

  // ── 1. Upsert de todos los permisos ──────────────────────────────────────
  console.log(`📋 Paso 1: Sincronizando ${ALL_PERMISSIONS.length} permisos...`);

  let created = 0;
  let updated = 0;

  for (const perm of ALL_PERMISSIONS) {
    const existing = await prisma.permission.findUnique({
      where: { name: perm.name },
    });

    if (existing) {
      await prisma.permission.update({
        where: { name: perm.name },
        data: {
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
        },
      });
      updated++;
    } else {
      await prisma.permission.create({
        data: {
          name: perm.name,
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
        },
      });
      created++;
      console.log(`   ➕ Nuevo permiso: ${perm.name}`);
    }
  }

  console.log(`   ✅ ${created} permisos nuevos | ${updated} actualizados\n`);

  // ── 2. Obtener permiso super:admin de la BD ───────────────────────────────
  const superAdminPermission = await prisma.permission.findUnique({
    where: { name: "super:admin" },
  });

  if (!superAdminPermission) {
    throw new Error(
      '❌ El permiso "super:admin" no existe en la BD. Algo falló en el paso 1.'
    );
  }

  // ── 3. Garantizar rol global "administrador" (tenantId = null) ────────────
  console.log('👑 Paso 2: Verificando rol global "administrador"...');

  let adminRole = await prisma.role.findFirst({
    where: { name: "administrador", tenantId: null },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: "administrador", tenantId: null },
    });
    console.log('   ➕ Rol "administrador" global creado');
  } else {
    console.log('   ✅ Rol "administrador" global ya existe');
  }

  // ── 4. Garantizar que "super:admin" esté asignado al rol ─────────────────
  console.log('🔗 Paso 3: Verificando asignación de "super:admin" al rol...');

  const existingRolePermission = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: superAdminPermission.id,
      },
    },
  });

  if (!existingRolePermission) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: superAdminPermission.id,
      },
    });
    console.log('   ➕ Permiso "super:admin" asignado al rol "administrador"');
  } else {
    console.log('   ✅ Permiso "super:admin" ya está asignado al rol');
  }

  // ── 5. Verificar/asignar el rol al usuario super admin ───────────────────
  console.log(`\n👤 Paso 4: Verificando usuario super admin (${SUPER_ADMIN_EMAIL})...`);

  const superAdminUser = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (!superAdminUser) {
    console.log(
      `   ⚠️  Usuario "${SUPER_ADMIN_EMAIL}" no encontrado en la BD.`
    );
    console.log(
      "       El usuario debe iniciar sesión primero para ser creado.\n"
    );
  } else {
    console.log(`   ✅ Usuario encontrado: ${superAdminUser.name ?? superAdminUser.email}`);

    // Verificar si ya tiene el rol administrador global
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: superAdminUser.id,
        roleId: adminRole.id,
        tenantId: null,
      },
    });

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          userId: superAdminUser.id,
          roleId: adminRole.id,
          tenantId: null,
        },
      });
      console.log(
        '   ➕ Rol "administrador" asignado al usuario super admin\n'
      );
    } else {
      console.log(
        '   ✅ Usuario ya tiene el rol "administrador" global asignado\n'
      );
    }
  }

  // ── 6. Resumen final ──────────────────────────────────────────────────────
  console.log("=".repeat(55));
  console.log("✅ Seed de permisos completado exitosamente.");
  console.log("\n📊 Estado final en la BD:");

  const totalPermissions = await prisma.permission.count();
  const totalRoles = await prisma.role.count({ where: { tenantId: null } });

  const adminRolePerms = await prisma.rolePermission.findMany({
    where: { roleId: adminRole?.id },
    include: { permission: { select: { name: true } } },
  });

  const adminRoleUsers = await prisma.userRole.findMany({
    where: { roleId: adminRole?.id, tenantId: null },
    include: { user: { select: { email: true } } },
  });

  console.log(`   Total permisos en BD: ${totalPermissions}`);
  console.log(`   Roles globales: ${totalRoles}`);
  console.log(
    `   Permisos del rol "administrador": ${adminRolePerms.map((p: { permission: { name: string } }) => p.permission.name).join(", ") || "ninguno"}`
  );
  console.log(
    `   Usuarios con rol "administrador": ${adminRoleUsers.map((ur: { user: { email: string } }) => ur.user.email).join(", ") || "ninguno"}`
  );
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
