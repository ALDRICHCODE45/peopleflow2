import { PrismaClient, LeadStatus } from "../src/core/generated/prisma/client";
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
    "clientes:gestionar",
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
    "clientes:gestionar",
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

// =============================================
// SEED DE DATOS DEL MÓDULO DE LEADS
// =============================================

/**
 * Datos de sectores con subsectores para seed
 */
const SECTORS_DATA = [
  {
    name: "Tecnología",
    subsectors: ["SaaS", "Fintech", "E-commerce", "Ciberseguridad", "Inteligencia Artificial"],
  },
  {
    name: "Salud",
    subsectors: ["Farmacéutica", "Hospitales", "Seguros Médicos", "Biotecnología", "Dispositivos Médicos"],
  },
  {
    name: "Manufactura",
    subsectors: ["Automotriz", "Alimentos", "Textil", "Electrónica", "Maquinaria"],
  },
  {
    name: "Servicios Financieros",
    subsectors: ["Banca", "Seguros", "Inversiones", "Créditos", "Pagos Digitales"],
  },
  {
    name: "Retail",
    subsectors: ["Moda", "Supermercados", "Electrónicos", "Hogar", "Deportes"],
  },
  {
    name: "Energía",
    subsectors: ["Petróleo y Gas", "Energías Renovables", "Electricidad", "Minería"],
  },
  {
    name: "Construcción",
    subsectors: ["Residencial", "Comercial", "Industrial", "Infraestructura"],
  },
  {
    name: "Educación",
    subsectors: ["Universidades", "Capacitación Corporativa", "EdTech", "Escuelas"],
  },
];

/**
 * Datos de orígenes de leads para seed
 */
const LEAD_ORIGINS_DATA = [
  { name: "LinkedIn", description: "Prospección y contacto vía LinkedIn" },
  { name: "Referido", description: "Referencia de cliente existente o contacto" },
  { name: "Email Campaign", description: "Respuesta a campaña de email marketing" },
  { name: "Website", description: "Formulario de contacto del sitio web" },
  { name: "Evento", description: "Feria comercial, conferencia o evento presencial" },
  { name: "Cold Call", description: "Llamada en frío de prospección" },
  { name: "Redes Sociales", description: "Contacto vía Facebook, Twitter, Instagram" },
  { name: "Partner", description: "Lead referido por socio comercial" },
  { name: "Inbound", description: "Lead que llegó por contenido o SEO" },
];

/**
 * Seed de sectores industriales con subsectores
 */
export async function seedSectors(prisma: PrismaClient) {
  console.log("🏭 Creando sectores y subsectores...");

  const createdSectors: { id: string; name: string }[] = [];

  for (const sectorData of SECTORS_DATA) {
    // Crear sector global (tenantId = null)
    // Usamos findFirst + create en lugar de upsert porque Prisma no permite null en índices únicos compuestos
    let sector = await prisma.sector.findFirst({
      where: { name: sectorData.name, tenantId: null },
    });

    if (!sector) {
      sector = await prisma.sector.create({
        data: { name: sectorData.name, isActive: true, tenantId: null },
      });
    }

    createdSectors.push({ id: sector.id, name: sector.name });

    // Crear subsectores
    for (const subsectorName of sectorData.subsectors) {
      await prisma.subsector.upsert({
        where: {
          name_sectorId: { name: subsectorName, sectorId: sector.id },
        },
        update: {},
        create: {
          name: subsectorName,
          sectorId: sector.id,
          isActive: true,
          tenantId: null,
        },
      });
    }
  }

  console.log(`✅ ${SECTORS_DATA.length} sectores y ${SECTORS_DATA.reduce((acc, s) => acc + s.subsectors.length, 0)} subsectores creados`);

  return createdSectors;
}

/**
 * Seed de orígenes de leads
 */
export async function seedLeadOrigins(prisma: PrismaClient) {
  console.log("🎯 Creando orígenes de leads...");

  const createdOrigins: { id: string; name: string }[] = [];

  for (const originData of LEAD_ORIGINS_DATA) {
    // Usamos findFirst + create/update en lugar de upsert porque Prisma no permite null en índices únicos compuestos
    let origin = await prisma.leadOrigin.findFirst({
      where: { name: originData.name, tenantId: null },
    });

    if (origin) {
      origin = await prisma.leadOrigin.update({
        where: { id: origin.id },
        data: { description: originData.description },
      });
    } else {
      origin = await prisma.leadOrigin.create({
        data: {
          name: originData.name,
          description: originData.description,
          isActive: true,
          tenantId: null,
        },
      });
    }

    createdOrigins.push({ id: origin.id, name: origin.name });
  }

  console.log(`✅ ${LEAD_ORIGINS_DATA.length} orígenes de leads creados`);

  return createdOrigins;
}

/**
 * Seed de leads de ejemplo con contactos
 */
export async function seedSampleLeads(
  prisma: PrismaClient,
  tenantId: string,
  userId: string
) {
  console.log("📋 Creando leads de ejemplo...");

  // Obtener algunos sectores y orígenes para asignar
  const sectors = await prisma.sector.findMany({ take: 5 });
  const origins = await prisma.leadOrigin.findMany({ take: 5 });

  const leadsData = [
    {
      companyName: "TechCorp Solutions",
      website: "https://techcorp.com",
      linkedInUrl: "https://linkedin.com/company/techcorp",
      address: "Av. Reforma 123, CDMX",
      subOrigin: "LinkedIn Ads",
      employeeCount: "50-100 empleados",
      notes: "Empresa de tecnología interesada en servicios de reclutamiento de desarrolladores",
      status: "CONTACTO_CALIDO" as LeadStatus,
      contacts: [
        {
          firstName: "Carlos",
          lastName: "Rodríguez",
          email: "carlos.rodriguez@techcorp.com",
          phone: "+52 55 1234 5678",
          position: "Director de RH",
          isPrimary: true,
        },
        {
          firstName: "María",
          lastName: "García",
          email: "maria.garcia@techcorp.com",
          phone: "+52 55 8765 4321",
          position: "Gerente de Talento",
          isPrimary: false,
        },
      ],
    },
    {
      companyName: "Innovate Labs",
      website: "https://innovatelabs.mx",
      linkedInUrl: "https://linkedin.com/company/innovatelabs",
      address: "Blvd. Insurgentes Sur 456, CDMX",
      subOrigin: "Referido por cliente",
      employeeCount: "10-20 empleados",
      notes: "Startup en crecimiento, necesitan escalar equipo de desarrollo",
      status: "CITA_AGENDADA" as LeadStatus,
      contacts: [
        {
          firstName: "Ana",
          lastName: "Martínez",
          email: "ana@innovatelabs.mx",
          phone: "+52 55 2345 6789",
          position: "CEO",
          isPrimary: true,
        },
      ],
    },
    {
      companyName: "Global Fintech",
      website: "https://globalfintech.com",
      linkedInUrl: "https://linkedin.com/company/globalfintech",
      address: "Paseo de la Reforma 789, CDMX",
      subOrigin: "Landing page principal",
      employeeCount: "100-200 empleados",
      notes: "Fintech en expansión regional, buscan perfiles especializados",
      status: "CITA_VALIDADA" as LeadStatus,
      contacts: [
        {
          firstName: "Roberto",
          lastName: "López",
          email: "roberto.lopez@globalfintech.com",
          phone: "+52 55 3456 7890",
          position: "CHRO",
          isPrimary: true,
        },
        {
          firstName: "Laura",
          lastName: "Sánchez",
          email: "laura.sanchez@globalfintech.com",
          phone: "+52 55 4567 8901",
          position: "Talent Acquisition Lead",
          isPrimary: false,
        },
      ],
    },
    {
      companyName: "Health Solutions MX",
      website: "https://healthsolutions.mx",
      linkedInUrl: null,
      address: "Av. Universidad 321, Monterrey",
      subOrigin: "Google Ads",
      employeeCount: "200-500 empleados",
      notes: "Empresa del sector salud, interesados en perfiles de TI para hospitales",
      status: "SOCIAL_SELLING" as LeadStatus,
      contacts: [
        {
          firstName: "Patricia",
          lastName: "Hernández",
          email: "patricia@healthsolutions.mx",
          phone: "+52 81 1234 5678",
          position: "Directora de Operaciones",
          isPrimary: true,
        },
      ],
    },
    {
      companyName: "EcoEnergy Corp",
      website: "https://ecoenergy.com.mx",
      linkedInUrl: "https://linkedin.com/company/ecoenergy",
      address: "Av. Chapultepec 654, Guadalajara",
      subOrigin: "Evento de networking",
      employeeCount: "20-50 empleados",
      notes: "Empresa de energías renovables en crecimiento",
      status: "STAND_BY" as LeadStatus,
      contacts: [
        {
          firstName: "Miguel",
          lastName: "Torres",
          email: "miguel.torres@ecoenergy.com.mx",
          phone: "+52 33 2345 6789",
          position: "Gerente de RH",
          isPrimary: true,
        },
      ],
    },
  ];

  let leadCount = 0;
  let contactCount = 0;

  for (let i = 0; i < leadsData.length; i++) {
    const leadData = leadsData[i];
    const sector = sectors[i % sectors.length];
    const origin = origins[i % origins.length];

    // Obtener subsector del sector
    const subsector = await prisma.subsector.findFirst({
      where: { sectorId: sector.id },
    });

    const lead = await prisma.lead.create({
      data: {
        companyName: leadData.companyName,
        website: leadData.website,
        linkedInUrl: leadData.linkedInUrl,
        address: leadData.address,
        subOrigin: leadData.subOrigin,
        employeeCount: leadData.employeeCount,
        notes: leadData.notes,
        status: leadData.status,
        sectorId: sector.id,
        subsectorId: subsector?.id,
        originId: origin.id,
        assignedToId: userId,
        tenantId: tenantId,
        createdById: userId,
      },
    });

    leadCount++;

    // Crear contactos para este lead
    for (const contactData of leadData.contacts) {
      await prisma.contact.create({
        data: {
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          position: contactData.position,
          isPrimary: contactData.isPrimary,
          leadId: lead.id,
          tenantId: tenantId,
        },
      });
      contactCount++;
    }
  }

  console.log(`✅ ${leadCount} leads y ${contactCount} contactos de ejemplo creados`);
}
