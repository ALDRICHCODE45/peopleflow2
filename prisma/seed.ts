import "dotenv/config";
import { PrismaClient } from "../src/core/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import {
  seedPermissions,
  seedRoles,
  seedTenants,
  seedSectors,
  seedLeadOrigins,
  seedSampleLeads,
} from "./seedPermissions";
import { auth } from "../src/core/lib/auth";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL no está configurado. Por favor, configura DATABASE_URL en tu archivo .env",
  );
}

const connectionString = process.env.DATABASE_URL;

// Crear el pool con configuración explícita
const pool = new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Crea un usuario de prueba si no existe usando Better Auth API
 * Better Auth se encarga del hashing de contraseñas automáticamente
 */
async function createTestUser(
  email: string,
  name: string,
  password: string,
): Promise<{ id: string; email: string; name: string | null } | null> {
  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`  ✓ Usuario ${email} ya existe`);
    return existingUser;
  }

  // Crear el usuario usando Better Auth API
  console.log(`  → Creando usuario ${email}...`);

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!result.user) {
      console.error(
        `  ✗ Error al crear usuario ${email}: No se retornó usuario`,
      );
      return null;
    }

    // Marcar email como verificado para pruebas
    await prisma.user.update({
      where: { id: result.user.id },
      data: { emailVerified: true },
    });

    console.log(`  ✓ Usuario ${email} creado exitosamente`);
    return {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
    };
  } catch (error) {
    console.error(`  ✗ Error al crear usuario ${email}:`, error);
    return null;
  }
}

async function main() {
  console.log("🌱 Iniciando seed...\n");

  // 1. Seed de permisos
  await seedPermissions(prisma);
  console.log("");

  // 2. Seed de tenants (necesario antes de roles)
  const { tenantA, tenantB } = await seedTenants(prisma);
  console.log("");

  // 3. Seed de roles con sus permisos (ahora con tenants)
  const roles = await seedRoles(prisma, tenantA, tenantB);
  console.log("");

  // 4. Seed de datos del módulo de Leads (catálogos globales)
  await seedSectors(prisma);
  console.log("");

  await seedLeadOrigins(prisma);
  console.log("");

  // 4. Crear usuarios de prueba si no existen
  console.log("👤 Creando/verificando usuarios de prueba...");

  const adminUser = await createTestUser(
    "admin@ejemplo.com",
    "Super Admin",
    "password123",
  );

  const gerenteUser = await createTestUser(
    "gerente@ejemplo.com",
    "Gerente Finanzas",
    "password123",
  );

  const capturadorUser = await createTestUser(
    "capturador@ejemplo.com",
    "Capturador",
    "password123",
  );

  console.log("");

  // 5. Asignar usuarios a tenants con roles
  console.log("🔗 Asignando usuarios a tenants...");

  if (adminUser) {
    // Admin: rol administrador (super:admin global, sin tenant específico)
    const existingAdminRole = await prisma.userRole.findFirst({
      where: {
        userId: adminUser.id,
        roleId: roles.adminRole.id,
      },
    });

    if (!existingAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: roles.adminRole.id,
          tenantId: null, // Super admin sin tenant específico
        },
      });
    }
    console.log("  ✓ admin@ejemplo.com → rol administrador (super:admin)");
  }

  if (gerenteUser) {
    // Gerente: gerente-finanzas en ambas empresas (cada tenant tiene su propio rol)
    await prisma.userRole.upsert({
      where: {
        userId_tenantId_roleId: {
          userId: gerenteUser.id,
          tenantId: tenantA.id,
          roleId: roles.gerenteFinanzasRoleA.id,
        },
      },
      update: {},
      create: {
        userId: gerenteUser.id,
        roleId: roles.gerenteFinanzasRoleA.id,
        tenantId: tenantA.id,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_tenantId_roleId: {
          userId: gerenteUser.id,
          tenantId: tenantB.id,
          roleId: roles.gerenteFinanzasRoleB.id,
        },
      },
      update: {},
      create: {
        userId: gerenteUser.id,
        roleId: roles.gerenteFinanzasRoleB.id,
        tenantId: tenantB.id,
      },
    });
    console.log(
      "  ✓ gerente@ejemplo.com → rol gerente-finanzas (Empresa A y B)",
    );
  }

  if (capturadorUser) {
    // Capturador: capturador en Empresa A
    await prisma.userRole.upsert({
      where: {
        userId_tenantId_roleId: {
          userId: capturadorUser.id,
          tenantId: tenantA.id,
          roleId: roles.capturadorRoleA.id,
        },
      },
      update: {},
      create: {
        userId: capturadorUser.id,
        roleId: roles.capturadorRoleA.id,
        tenantId: tenantA.id,
      },
    });
    console.log("  ✓ capturador@ejemplo.com → rol capturador (Empresa A)");
  }

  console.log("");

  // 6. Seed de leads de ejemplo (para el tenant A)
  if (adminUser) {
    await seedSampleLeads(prisma, tenantA.id, adminUser.id);
  }

  console.log("\n" + "═".repeat(60));
  console.log("✅ SEED COMPLETADO EXITOSAMENTE!");
  console.log("═".repeat(60));

  console.log("\n📝 Resumen de datos creados:");
  console.log("   • Permisos del sistema (todos los módulos)");
  console.log("   • 2 Tenants: Trust People, Relevant");
  console.log("   • 9 Roles: 1 global (administrador) + 4 por cada tenant");
  console.log("   • 3 Usuarios de prueba");
  console.log("   • Catálogos de Leads: Sectores, Subsectores, Orígenes");
  console.log("   • 5 Leads de ejemplo con contactos (Trust People)");

  console.log("\n🔐 CREDENCIALES DE ACCESO:");
  console.log("   ┌─────────────────────────────────────────────────────────┐");
  console.log("   │ Email                    │ Contraseña  │ Rol            │");
  console.log("   ├─────────────────────────────────────────────────────────┤");
  console.log("   │ admin@ejemplo.com        │ password123 │ Super Admin    │");
  console.log("   │ gerente@ejemplo.com      │ password123 │ Gerente Finanz │");
  console.log("   │ capturador@ejemplo.com   │ password123 │ Capturador     │");
  console.log("   └─────────────────────────────────────────────────────────┘");

  console.log("\n🧪 PRUEBAS RECOMENDADAS:");
  console.log("   1. Inicia sesión con admin@ejemplo.com → Ve /super-admin");
  console.log(
    "   2. Inicia sesión con gerente@ejemplo.com → Ve selector de tenant",
  );
  console.log(
    "   3. Inicia sesión con capturador@ejemplo.com → Ve /finanzas/ingresos",
  );
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
