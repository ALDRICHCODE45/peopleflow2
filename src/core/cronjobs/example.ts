import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../generated/prisma/client";

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

const exampleCronJob = async () => {
  try {
    const firstLead = await prisma.lead.findFirst();
    console.log("Cron Job ejecutado con exico", firstLead);
  } catch (e) {
    console.log("Error en el cron job", e);
  }
};

exampleCronJob()
  .catch((e) => {
    console.log("X Error en el cronJob: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
