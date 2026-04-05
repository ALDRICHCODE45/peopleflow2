/**
 * Seed de Leads para Testing de Infinite Scroll
 *
 * Genera 500+ leads distribuidos en los 8 estados del Kanban
 * para probar la funcionalidad de infinite scroll (20 leads por página).
 *
 * Ejecutar con: bun run db:seed:leads
 */

import "dotenv/config";
import { PrismaClient, LeadStatus } from "../src/core/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import countryRegionData from "country-region-data/data.json";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL no está configurado. Por favor, configura DATABASE_URL en tu archivo .env"
  );
}

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// =============================================
// DATOS PARA GENERACIÓN ALEATORIA
// =============================================

const COMPANY_PREFIXES = [
  "Tech",
  "Global",
  "Smart",
  "Digital",
  "Pro",
  "Next",
  "Future",
  "Prime",
  "Elite",
  "Ultra",
  "Mega",
  "Super",
  "Alpha",
  "Beta",
  "Omega",
  "Neo",
  "Max",
  "Core",
  "Peak",
  "Edge",
];

const COMPANY_NAMES = [
  "Systems",
  "Solutions",
  "Dynamics",
  "Innovations",
  "Ventures",
  "Partners",
  "Group",
  "Industries",
  "Technologies",
  "Consulting",
  "Services",
  "Labs",
  "Works",
  "Hub",
  "Network",
  "Connect",
  "Logic",
  "Wave",
  "Force",
  "Link",
];

const COMPANY_SUFFIXES = [
  "Corp",
  "Inc",
  "SA de CV",
  "SAPI",
  "LLC",
  "MX",
  "Lat",
  "Plus",
  "Pro",
  "360",
];

interface Region {
  name: string;
  shortCode: string;
}

interface CountryRegion {
  countryName: string;
  countryShortCode: string;
  regions: Region[];
}

const LOCATION_COUNTRIES = ["MX", "US", "CO", "AR", "CL", "PE"];

const locationCatalog = (countryRegionData as CountryRegion[]).filter((country) =>
  LOCATION_COUNTRIES.includes(country.countryShortCode),
);

// =============================================
// DISTRIBUCIÓN DE LEADS POR STATUS
// =============================================

const LEADS_DISTRIBUTION: Record<LeadStatus, number> = {
  CONTACTO: 80,
  SOCIAL_SELLING: 70,
  CONTACTO_CALIDO: 65,
  CITA_AGENDADA: 60,
  CITA_ATENDIDA: 55,
  CITA_VALIDADA: 50,
  POSICIONES_ASIGNADAS: 60,
  STAND_BY: 60,
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCompanyName(index: number): string {
  // Combinamos índice con aleatorio para evitar duplicados
  const prefix = COMPANY_PREFIXES[index % COMPANY_PREFIXES.length];
  const name = randomElement(COMPANY_NAMES);
  const suffix = randomElement(COMPANY_SUFFIXES);
  const uniqueId = Math.floor(index / COMPANY_PREFIXES.length) + 1;

  // Solo agregar número si es necesario para evitar duplicados
  if (uniqueId > 1) {
    return `${prefix} ${name} ${suffix} ${uniqueId}`;
  }
  return `${prefix} ${name} ${suffix}`;
}

const EMPLOYEE_COUNT_OPTIONS = [
  "1-10 empleados",
  "11-50 empleados",
  "51-100 empleados",
  "101-250 empleados",
  "251-500 empleados",
  "501-1000 empleados",
  "1000+ empleados",
];

const SUB_ORIGIN_OPTIONS = [
  "https://linkedin.com/feed/post/123456",
  "https://facebook.com/company/post/789",
  "Referido por cliente actual",
  "Evento de networking AMECH",
  "Webinar de HR Tech",
  "Publicación en blog",
  "Búsqueda orgánica Google",
  "Campaña de email marketing",
  "Feria de empleo CDMX",
  null, // Some leads may not have a sub-origin
];

function generatePostalCode(countryCode: string): string {
  switch (countryCode) {
    case "MX":
    case "US":
      return String(randomInt(10000, 99999));
    case "AR":
      return String(randomInt(1000, 9999));
    case "CO":
    case "CL":
    case "PE":
      return String(randomInt(100000, 999999));
    default:
      return String(randomInt(10000, 99999));
  }
}

function generateLocationCodes(): {
  countryCode: string;
  regionCode: string | null;
  postalCode: string;
} {
  const country = randomElement(locationCatalog);
  const region = country.regions.length > 0 ? randomElement(country.regions) : null;

  return {
    countryCode: country.countryShortCode,
    regionCode: region?.shortCode ?? null,
    postalCode: generatePostalCode(country.countryShortCode),
  };
}

function generateWebsite(companyName: string): string {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .substring(0, 20);
  return `https://${slug}.com`;
}

function generateLinkedInUrl(companyName: string): string | null {
  // 70% de probabilidad de tener LinkedIn
  if (Math.random() > 0.7) return null;

  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .substring(0, 30);
  return `https://linkedin.com/company/${slug}`;
}

function generateRandomDate(daysBack: number): Date {
  const now = new Date();
  const daysAgo = randomInt(0, daysBack);
  now.setDate(now.getDate() - daysAgo);
  return now;
}

const NOTES_TEMPLATES = [
  "Empresa interesada en servicios de reclutamiento",
  "Potencial cliente para headhunting de perfiles tecnológicos",
  "Contacto inicial realizado, esperando respuesta",
  "Interés en servicios de outsourcing de personal",
  "Requiere perfiles especializados en su industria",
  "Empresa en expansión, necesita escalar equipo",
  "Buscando mejorar su proceso de atracción de talento",
  "Interés en servicios de evaluación y assessment",
  "Necesita apoyo en reclutamiento masivo",
  "Proyecto de transformación digital requiere talento especializado",
];

// =============================================
// FUNCIÓN PRINCIPAL DE SEED
// =============================================

async function seedTestLeads() {
  console.log("🚀 Iniciando seed de leads para testing de infinite scroll...\n");

  // 1. Obtener tenant (Trust People)
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "trust-people" },
  });

  if (!tenant) {
    console.error("❌ No se encontró el tenant 'Trust People'. Ejecuta primero: bun run db:seed");
    process.exit(1);
  }

  console.log(`✅ Tenant encontrado: ${tenant.name}`);

  // 2. Obtener usuario admin para asignar leads
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@ejemplo.com" },
  });

  if (!adminUser) {
    console.error("❌ No se encontró el usuario admin. Ejecuta primero: bun run db:seed");
    process.exit(1);
  }

  console.log(`✅ Usuario admin encontrado: ${adminUser.email}`);

  // 3. Obtener sectores y orígenes existentes
  const sectors = await prisma.sector.findMany({
    where: { isActive: true },
    include: { subsectors: { where: { isActive: true } } },
  });

  const origins = await prisma.leadOrigin.findMany({
    where: { isActive: true },
  });

  if (sectors.length === 0 || origins.length === 0) {
    console.error("❌ No se encontraron sectores u orígenes. Ejecuta primero: bun run db:seed");
    process.exit(1);
  }

  console.log(`✅ Sectores disponibles: ${sectors.length}`);
  console.log(`✅ Orígenes disponibles: ${origins.length}`);

  // 4. Generar leads por cada status
  console.log("\n📊 Generando leads por status...\n");

  const statuses = Object.keys(LEADS_DISTRIBUTION) as LeadStatus[];
  let totalLeads = 0;
  let totalContacts = 0;
  let globalIndex = 0;

  for (const status of statuses) {
    const count = LEADS_DISTRIBUTION[status];
    console.log(`  → Creando ${count} leads con status ${status}...`);

    // Crear leads en batches de 50 para mejor rendimiento
    const batchSize = 50;
    for (let batch = 0; batch < count; batch += batchSize) {
      const leadsToCreate = Math.min(batchSize, count - batch);
      const leadsData = [];

      for (let i = 0; i < leadsToCreate; i++) {
        const sector = randomElement(sectors);
        const subsector =
          sector.subsectors.length > 0
            ? randomElement(sector.subsectors)
            : null;
        const origin = randomElement(origins);
        const companyName = generateCompanyName(globalIndex);
        const location = generateLocationCodes();

        leadsData.push({
          companyName,
          website: generateWebsite(companyName),
          linkedInUrl: generateLinkedInUrl(companyName),
          countryCode: location.countryCode,
          regionCode: location.regionCode,
          postalCode: location.postalCode,
          subOrigin: randomElement(SUB_ORIGIN_OPTIONS),
          employeeCount: randomElement(EMPLOYEE_COUNT_OPTIONS),
          notes: randomElement(NOTES_TEMPLATES),
          status,
          sectorId: sector.id,
          subsectorId: subsector?.id ?? null,
          originId: origin.id,
          assignedToId: adminUser.id,
          tenantId: tenant.id,
          createdById: adminUser.id,
          createdAt: generateRandomDate(90),
        });

        globalIndex++;
      }

      // Crear leads en batch
      await prisma.lead.createMany({
        data: leadsData,
      });

      totalLeads += leadsData.length;
    }

    // Crear contactos para algunos leads de este status (50% de los leads tendrán contactos)
    const leadsWithStatus = await prisma.lead.findMany({
      where: {
        tenantId: tenant.id,
        status,
      },
      take: Math.floor(count * 0.5),
      orderBy: { createdAt: "desc" },
    });

    for (const lead of leadsWithStatus) {
      // 1-2 contactos por lead
      const contactCount = randomInt(1, 2);
      for (let c = 0; c < contactCount; c++) {
        await prisma.contact.create({
          data: {
            firstName: `Contacto${c + 1}`,
            lastName: lead.companyName.split(" ")[0],
            email: `contacto${c + 1}@${lead.companyName.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 15)}.com`,
            phone: `+52 ${randomInt(55, 99)} ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`,
            position: randomElement([
              "Director de RH",
              "Gerente de Talento",
              "CEO",
              "CHRO",
              "Talent Acquisition Lead",
              "Coordinador de RH",
            ]),
            isPrimary: c === 0,
            leadId: lead.id,
            tenantId: tenant.id,
          },
        });
        totalContacts++;
      }
    }
  }

  // 5. Mostrar resumen
  console.log("\n" + "═".repeat(60));
  console.log("✅ SEED DE LEADS COMPLETADO!");
  console.log("═".repeat(60));

  console.log("\n📊 Resumen de datos creados:");
  console.log(`   • Total de leads: ${totalLeads}`);
  console.log(`   • Total de contactos: ${totalContacts}`);

  console.log("\n📈 Distribución por status:");
  for (const status of statuses) {
    const count = await prisma.lead.count({
      where: { tenantId: tenant.id, status },
    });
    console.log(`   • ${status}: ${count} leads`);
  }

  console.log("\n🧪 Para verificar:");
  console.log("   1. Abre Prisma Studio: bun run prisma:studio");
  console.log("   2. Inicia el servidor: bun run dev");
  console.log("   3. Navega al Kanban de leads");
  console.log("   4. Verifica que cada columna muestre ~20 leads inicialmente");
  console.log("   5. Haz scroll para ver la carga de más leads");
}

// =============================================
// EJECUCIÓN
// =============================================

seedTestLeads()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
