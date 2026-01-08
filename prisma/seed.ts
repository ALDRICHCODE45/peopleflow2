import "dotenv/config";
import { PrismaClient } from "../src/core/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL no está configurado. Por favor, configura DATABASE_URL en tu archivo .env"
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

async function main() {
  console.log("🌱 Iniciando seed...");

  // Limpiar datos existentes (opcional, comentar si no quieres eliminar datos)
  console.log("🧹 Limpiando datos existentes...");
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  //await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();

  // Crear Permisos
  console.log("📋 Creando permisos...");
  const permFacturasAcceder = await prisma.permission.create({
    data: {
      name: "facturas:acceder",
      resource: "facturas",
      action: "acceder",
      description: "Permite acceder a la sección de facturas",
    },
  });

  const permFacturasCrear = await prisma.permission.create({
    data: {
      name: "facturas:crear",
      resource: "facturas",
      action: "crear",
      description: "Permite crear nuevas facturas",
    },
  });

  const permColaboradoresAcceder = await prisma.permission.create({
    data: {
      name: "colaboradores:acceder",
      resource: "colaboradores",
      action: "acceder",
      description: "Permite acceder a la sección de colaboradores",
    },
  });

  const permColaboradoresCrear = await prisma.permission.create({
    data: {
      name: "colaboradores:crear",
      resource: "colaboradores",
      action: "crear",
      description: "Permite crear nuevos colaboradores",
    },
  });

  const permColaboradoresEditar = await prisma.permission.create({
    data: {
      name: "colaboradores:editar",
      resource: "colaboradores",
      action: "editar",
      description: "Permite editar colaboradores existentes",
    },
  });

  // Crear Roles
  console.log("👥 Creando roles...");
  const roleCapturador = await prisma.role.create({
    data: {
      name: "capturador",
    },
  });

  const roleGerente = await prisma.role.create({
    data: {
      name: "gerente",
    },
  });

  const roleSuperadmin = await prisma.role.create({
    data: {
      name: "superadmin",
    },
  });

  // Asignar permisos a roles
  console.log("🔗 Asignando permisos a roles...");

  // Capturador: facturas:acceder, facturas:crear
  await prisma.rolePermission.createMany({
    data: [
      { roleId: roleCapturador.id, permissionId: permFacturasAcceder.id },
      { roleId: roleCapturador.id, permissionId: permFacturasCrear.id },
    ],
  });

  // Gerente: colaboradores:acceder, colaboradores:crear, colaboradores:editar
  await prisma.rolePermission.createMany({
    data: [
      { roleId: roleGerente.id, permissionId: permColaboradoresAcceder.id },
      { roleId: roleGerente.id, permissionId: permColaboradoresCrear.id },
      { roleId: roleGerente.id, permissionId: permColaboradoresEditar.id },
    ],
  });

  // Superadmin: todos los permisos (se maneja en código con '*')
  // No asignamos permisos específicos, se maneja en el código de permisos

  // Crear Tenants
  console.log("🏢 Creando tenants...");
  const tenantEmpresaA = await prisma.tenant.create({
    data: {
      name: "Empresa A",
      slug: "empresa-a",
    },
  });

  const tenantEmpresaB = await prisma.tenant.create({
    data: {
      name: "Empresa B",
      slug: "empresa-b",
    },
  });

  // NOTA: Los usuarios deben crearse manualmente usando Better Auth (signup)
  // Este seed asume que los usuarios ya existen con estos emails:
  // - capturador@ejemplo.com
  // - gerente@ejemplo.com
  // - superadmin@ejemplo.com

  console.log("👤 Buscando usuarios...");

  // Buscar usuarios existentes o crear IDs de ejemplo
  let user1 = await prisma.user.findUnique({
    where: { email: "capturador@ejemplo.com" },
  });

  let user2 = await prisma.user.findUnique({
    where: { email: "gerente@ejemplo.com" },
  });

  let user3 = await prisma.user.findUnique({
    where: { email: "superadmin@ejemplo.com" },
  });

  if (!user1 || !user2 || !user3) {
    console.log(
      "⚠️  Los usuarios no existen. Por favor, créalos primero usando la interfaz de registro."
    );
    console.log("   Usuarios necesarios:");
    console.log("   - capturador@ejemplo.com");
    console.log("   - gerente@ejemplo.com");
    console.log("   - superadmin@ejemplo.com");
    console.log("   \n   Luego ejecuta este seed nuevamente.");
    return;
  }

  // Asignar usuarios a tenants con roles
  console.log("🔗 Asignando usuarios a tenants...");

  // Usuario 1: capturador en ambas empresas
  await prisma.userRole.createMany({
    data: [
      {
        userId: user1.id,
        roleId: roleCapturador.id,
        tenantId: tenantEmpresaA.id,
      },
      {
        userId: user1.id,
        roleId: roleCapturador.id,
        tenantId: tenantEmpresaB.id,
      },
    ],
  });

  // Usuario 2: gerente en ambas empresas
  await prisma.userRole.createMany({
    data: [
      { userId: user2.id, roleId: roleGerente.id, tenantId: tenantEmpresaA.id },
      { userId: user2.id, roleId: roleGerente.id, tenantId: tenantEmpresaB.id },
    ],
  });

  // Usuario 3: superadmin (sin tenant - null)
  await prisma.userRole.create({
    data: {
      userId: user3.id,
      roleId: roleSuperadmin.id,
      tenantId: null,
    },
  });

  console.log("✅ Seed completado exitosamente!");
  console.log("\n📝 Datos creados:");
  console.log("- 2 Tenants: Empresa A, Empresa B");
  console.log("- 3 Roles: capturador, gerente, superadmin");
  console.log(
    "- 5 Permisos: facturas:acceder, facturas:crear, colaboradores:acceder, colaboradores:crear, colaboradores:editar"
  );
  console.log("- 3 Usuarios:");
  console.log("  * capturador@ejemplo.com (capturador en ambas empresas)");
  console.log("  * gerente@ejemplo.com (gerente en ambas empresas)");
  console.log("  * superadmin@ejemplo.com (superadmin global)");
  console.log("\n🔐 Contraseña para todos los usuarios: password123");
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
