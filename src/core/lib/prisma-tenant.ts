/**
 * Prisma Client Extension para Tenant Scoping
 *
 * Inyecta automáticamente el filtro de tenantId en las consultas
 * de modelos que requieren aislamiento de datos por tenant.
 *
 * IMPORTANTE: Este extension es ADICIONAL a la validación en los repositorios.
 * Funciona como una capa de seguridad adicional (defense in depth).
 */

import { PrismaClient } from "../generated/prisma/client";
import { getTenantContext } from "./tenant-context";

/**
 * Crea interceptores de tenant scoping para un modelo.
 * Inyecta tenantId en findMany, findFirst y count cuando hay contexto activo.
 */
function createTenantInterceptors() {
  const injectTenantId = ({ args }: { args: { where?: Record<string, unknown> } }) => {
    const context = getTenantContext();
    if (context?.tenantId && args.where?.tenantId === undefined) {
      args.where = { ...args.where, tenantId: context.tenantId };
    }
  };

  return {
    async findMany({ args, query }: { args: { where?: Record<string, unknown> }; query: (args: unknown) => Promise<unknown> }) {
      injectTenantId({ args });
      return query(args);
    },
    async findFirst({ args, query }: { args: { where?: Record<string, unknown> }; query: (args: unknown) => Promise<unknown> }) {
      injectTenantId({ args });
      return query(args);
    },
    async count({ args, query }: { args: { where?: Record<string, unknown> }; query: (args: unknown) => Promise<unknown> }) {
      injectTenantId({ args });
      return query(args);
    },
  };
}

/**
 * Crea un Prisma Client con extension para tenant scoping automático
 *
 * @param basePrisma - Instancia base de PrismaClient
 * @returns PrismaClient extendido con tenant scoping
 */
export function createTenantScopedPrisma(basePrisma: PrismaClient) {
  return basePrisma.$extends({
    name: "tenant-scoping",
    query: {
      userRole: createTenantInterceptors(),
      vacancy: createTenantInterceptors(),
      role: createTenantInterceptors(),
      sector: createTenantInterceptors(),
      subsector: createTenantInterceptors(),
      leadOrigin: createTenantInterceptors(),
      lead: createTenantInterceptors(),
      contact: createTenantInterceptors(),
      interaction: createTenantInterceptors(),
      leadStatusHistory: createTenantInterceptors(),
      attachment: createTenantInterceptors(),
      notification: createTenantInterceptors(),
      client: createTenantInterceptors(),
    },
  });
}

/**
 * Tipo del Prisma Client extendido con tenant scoping
 */
export type TenantScopedPrismaClient = ReturnType<typeof createTenantScopedPrisma>;
