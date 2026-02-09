/**
 * Seed de Expansión de Sectores y Subsectores
 *
 * Agrega 22 nuevos sectores con ~142 subsectores y ~30 subsectores
 * adicionales para los 8 sectores existentes.
 *
 * Idempotente: seguro de ejecutar múltiples veces.
 *
 * Ejecutar con: bun run db:seed:sectors
 */

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

const pool = new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// =============================================
// NUEVOS SECTORES (22) CON SUBSECTORES (~142)
// =============================================

const NEW_SECTORS_DATA = [
  {
    name: "Transporte y Logística",
    subsectors: [
      "Transporte Terrestre",
      "Transporte Marítimo",
      "Transporte Aéreo",
      "Almacenamiento y Distribución",
      "Logística de Última Milla",
      "Cadena de Suministro",
      "Paquetería y Mensajería",
    ],
  },
  {
    name: "Telecomunicaciones",
    subsectors: [
      "Telefonía Móvil",
      "Internet y Banda Ancha",
      "Infraestructura de Redes",
      "Televisión por Cable y Satélite",
      "Comunicaciones Unificadas",
      "Torres y Fibra Óptica",
    ],
  },
  {
    name: "Agricultura y Agroindustria",
    subsectors: [
      "Agricultura Tradicional",
      "Agricultura de Precisión",
      "Ganadería",
      "Acuacultura y Pesca",
      "Agroindustria y Procesamiento",
      "Insumos Agrícolas",
      "Silvicultura",
    ],
  },
  {
    name: "Turismo y Hotelería",
    subsectors: [
      "Hotelería y Resorts",
      "Agencias de Viajes",
      "Turismo de Aventura y Ecoturismo",
      "Restaurantes y Gastronomía",
      "Eventos y Convenciones",
      "Turismo Médico",
      "Transporte Turístico",
    ],
  },
  {
    name: "Entretenimiento y Medios",
    subsectors: [
      "Cine y Televisión",
      "Música y Audio",
      "Videojuegos",
      "Medios Digitales",
      "Editorial y Prensa",
      "Producción de Contenido",
      "Streaming y OTT",
    ],
  },
  {
    name: "Inmobiliario",
    subsectors: [
      "Desarrollo Residencial",
      "Desarrollo Comercial",
      "Administración de Propiedades",
      "Bienes Raíces Industriales",
      "Corretaje Inmobiliario",
      "PropTech",
    ],
  },
  {
    name: "Legal y Consultoría",
    subsectors: [
      "Derecho Corporativo",
      "Derecho Laboral",
      "Propiedad Intelectual",
      "Consultoría Estratégica",
      "Consultoría de Negocios",
      "Auditoría y Compliance",
      "Consultoría Fiscal",
    ],
  },
  {
    name: "Gobierno y Sector Público",
    subsectors: [
      "Administración Pública Federal",
      "Gobierno Estatal y Municipal",
      "Organismos Autónomos",
      "Defensa y Seguridad Nacional",
      "Servicios Públicos",
      "Política Pública y Regulación",
    ],
  },
  {
    name: "Medio Ambiente y Sostenibilidad",
    subsectors: [
      "Gestión de Residuos",
      "Tratamiento de Aguas",
      "Consultoría Ambiental",
      "Energía Limpia",
      "Economía Circular",
      "Certificaciones Ambientales",
      "Conservación y Restauración",
    ],
  },
  {
    name: "Alimentos y Bebidas",
    subsectors: [
      "Producción de Alimentos",
      "Bebidas Alcohólicas",
      "Bebidas No Alcohólicas",
      "Alimentos Procesados",
      "Alimentos Orgánicos y Naturales",
      "Cadenas de Restaurantes",
      "Food Tech",
      "Distribución de Alimentos",
    ],
  },
  {
    name: "Automotriz",
    subsectors: [
      "Fabricación de Vehículos",
      "Autopartes",
      "Distribuidoras y Agencias",
      "Vehículos Eléctricos",
      "Posventa y Servicios",
      "Vehículos Comerciales y Pesados",
      "Motocicletas",
    ],
  },
  {
    name: "Aeroespacial y Defensa",
    subsectors: [
      "Fabricación Aeronáutica",
      "Sistemas de Defensa",
      "Satélites y Espacio",
      "Mantenimiento Aeronáutico (MRO)",
      "Drones y Vehículos No Tripulados",
      "Aviación Comercial",
    ],
  },
  {
    name: "Química y Petroquímica",
    subsectors: [
      "Química Básica",
      "Petroquímica",
      "Química Especializada",
      "Plásticos y Polímeros",
      "Fertilizantes",
      "Pinturas y Recubrimientos",
    ],
  },
  {
    name: "Textil y Moda",
    subsectors: [
      "Diseño de Moda",
      "Fabricación Textil",
      "Fast Fashion",
      "Moda de Lujo",
      "Calzado",
      "Accesorios",
      "Moda Sostenible",
    ],
  },
  {
    name: "Minería y Metalurgia",
    subsectors: [
      "Minería de Metales Preciosos",
      "Minería de Metales Industriales",
      "Minería No Metálica",
      "Siderurgia",
      "Fundición y Forja",
      "Procesamiento de Minerales",
    ],
  },
  {
    name: "Servicios Profesionales",
    subsectors: [
      "Contabilidad y Finanzas",
      "Consultoría de TI",
      "Servicios de Ingeniería",
      "Arquitectura y Diseño",
      "Traducción e Interpretación",
      "Investigación de Mercado",
    ],
  },
  {
    name: "Marketing y Publicidad",
    subsectors: [
      "Agencias de Publicidad",
      "Marketing Digital",
      "Relaciones Públicas",
      "Branding y Diseño",
      "Social Media Marketing",
      "Performance Marketing",
      "Marketing de Contenidos",
    ],
  },
  {
    name: "Recursos Humanos y Staffing",
    subsectors: [
      "Reclutamiento y Selección",
      "Staffing Temporal",
      "Outsourcing de Personal",
      "Headhunting Ejecutivo",
      "HR Tech",
      "Capacitación y Desarrollo",
      "Nómina y Administración de Personal",
    ],
  },
  {
    name: "Seguros",
    subsectors: [
      "Seguros de Vida",
      "Seguros de Daños",
      "Seguros de Auto",
      "Reaseguro",
      "Seguros Empresariales",
      "InsurTech",
      "Seguros de Salud",
    ],
  },
  {
    name: "Comercio Internacional",
    subsectors: [
      "Importación y Exportación",
      "Aduanas y Comercio Exterior",
      "Trading Companies",
      "Zonas Francas y IMMEX",
      "Logística Internacional",
      "Financiamiento al Comercio",
    ],
  },
  {
    name: "Farmacéutica y Ciencias de la Vida",
    subsectors: [
      "Desarrollo de Fármacos",
      "Manufactura Farmacéutica",
      "Distribución Farmacéutica",
      "Investigación Clínica (CRO)",
      "Dispositivos de Diagnóstico",
      "Salud Animal",
    ],
  },
  {
    name: "Organizaciones Sin Fines de Lucro",
    subsectors: [
      "ONGs y Fundaciones",
      "Cooperación Internacional",
      "Salud y Bienestar Social",
      "Educación y Cultura",
      "Medio Ambiente",
      "Derechos Humanos",
    ],
  },
];

// =============================================
// EXPANSIÓN DE SECTORES EXISTENTES (~30 nuevos subsectores)
// =============================================

const EXISTING_SECTORS_EXPANSIONS = [
  {
    sectorName: "Tecnología",
    newSubsectors: [
      "Cloud Computing",
      "Blockchain",
      "Big Data y Analítica",
      "IoT (Internet de las Cosas)",
      "Desarrollo de Software",
      "Hardware y Semiconductores",
    ],
  },
  {
    sectorName: "Salud",
    newSubsectors: [
      "Telemedicina",
      "Salud Mental",
      "Rehabilitación",
      "Laboratorios Clínicos",
    ],
  },
  {
    sectorName: "Manufactura",
    newSubsectors: [
      "Manufactura Aditiva (3D)",
      "Manufactura Lean",
      "Embalaje y Empaque",
    ],
  },
  {
    sectorName: "Servicios Financieros",
    newSubsectors: [
      "Criptomonedas y Activos Digitales",
      "Microfinanzas",
      "Gestión de Patrimonios",
      "Factoraje y Arrendamiento",
    ],
  },
  {
    sectorName: "Retail",
    newSubsectors: [
      "Marketplace Online",
      "Tiendas de Conveniencia",
      "Retail de Lujo",
    ],
  },
  {
    sectorName: "Energía",
    newSubsectors: [
      "Almacenamiento de Energía",
      "Gas Natural",
      "Eficiencia Energética",
      "Hidrógeno Verde",
    ],
  },
  {
    sectorName: "Construcción",
    newSubsectors: [
      "Materiales de Construcción",
      "Ingeniería Civil",
      "Construcción Sustentable",
    ],
  },
  {
    sectorName: "Educación",
    newSubsectors: [
      "Educación a Distancia",
      "Educación Especial",
      "Certificaciones Profesionales",
    ],
  },
];

// =============================================
// FUNCIÓN PRINCIPAL
// =============================================

async function main() {
  console.log("🚀 Iniciando expansión de sectores y subsectores...\n");

  let newSectorsCreated = 0;
  let newSubsectorsCreated = 0;
  let expansionSubsectorsCreated = 0;

  // ── Fase 1: Crear nuevos sectores con sus subsectores ──

  console.log("📦 Fase 1: Creando nuevos sectores...");

  for (const sectorData of NEW_SECTORS_DATA) {
    let sector = await prisma.sector.findFirst({
      where: { name: sectorData.name, tenantId: null },
    });

    if (!sector) {
      sector = await prisma.sector.create({
        data: { name: sectorData.name, isActive: true, tenantId: null },
      });
      newSectorsCreated++;
    }

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
      newSubsectorsCreated++;
    }

    console.log(`   ✅ ${sectorData.name} (${sectorData.subsectors.length} subsectores)`);
  }

  // ── Fase 2: Expandir sectores existentes ──

  console.log("\n📦 Fase 2: Expandiendo sectores existentes...");

  for (const expansion of EXISTING_SECTORS_EXPANSIONS) {
    const sector = await prisma.sector.findFirst({
      where: { name: expansion.sectorName, tenantId: null },
    });

    if (!sector) {
      console.log(`   ⚠️  Sector "${expansion.sectorName}" no encontrado, saltando...`);
      continue;
    }

    for (const subsectorName of expansion.newSubsectors) {
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
      expansionSubsectorsCreated++;
    }

    console.log(`   ✅ ${expansion.sectorName} (+${expansion.newSubsectors.length} subsectores)`);
  }

  // ── Resumen ──

  const totalNewSubsectors = newSubsectorsCreated + expansionSubsectorsCreated;

  console.log("\n" + "=".repeat(50));
  console.log("📊 Resumen de expansión:");
  console.log(`   • Nuevos sectores: ${newSectorsCreated}`);
  console.log(`   • Subsectores en nuevos sectores: ${newSubsectorsCreated}`);
  console.log(`   • Subsectores en sectores existentes: ${expansionSubsectorsCreated}`);
  console.log(`   • Total nuevos subsectores: ${totalNewSubsectors}`);
  console.log("=".repeat(50));
  console.log("\n✅ Expansión completada exitosamente.");
}

main()
  .catch((error) => {
    console.error("❌ Error durante la expansión de sectores:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
