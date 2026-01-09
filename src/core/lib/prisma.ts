/**
 * Configuración de Prisma Client
 *
 * Este módulo exporta dos instancias de Prisma:
 * - `prisma` (default): Cliente base para consultas que no requieren tenant scoping
 * - `prismaWithTenant`: Cliente extendido con filtrado automático por tenant
 *
 * @example
 * ```typescript
 * // Para consultas sin tenant scoping (ej: auth, tenants)
 * import prisma from "@/core/lib/prisma";
 *
 * // Para consultas con tenant scoping automático
 * import { prismaWithTenant } from "@/core/lib/prisma";
 * import { runWithTenant } from "@/core/lib/tenant-context";
 *
 * const data = await runWithTenant(
 *   { tenantId: "...", userId: "..." },
 *   () => prismaWithTenant.userRole.findMany({})
 * );
 * ```
 */

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  createTenantScopedPrisma,
  type TenantScopedPrismaClient,
} from "./prisma-tenant";

/**
 * Configuración del adaptador PostgreSQL
 */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

/**
 * Tipo para el objeto global con instancias de Prisma
 */
type GlobalWithPrisma = typeof globalThis & {
  prisma: PrismaClient;
  prismaWithTenant: TenantScopedPrismaClient;
};

const globalForPrisma = global as GlobalWithPrisma;

/**
 * Instancia base de Prisma Client
 * Usar para consultas que NO requieren filtrado por tenant
 */
const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

/**
 * Instancia de Prisma Client con tenant scoping automático
 * Usar con runWithTenant() para inyectar el tenantId automáticamente
 */
const prismaWithTenant: TenantScopedPrismaClient =
  globalForPrisma.prismaWithTenant || createTenantScopedPrisma(prisma);

// Cachear instancias en desarrollo para evitar múltiples conexiones
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaWithTenant = prismaWithTenant;
}

export default prisma;
export { prismaWithTenant };