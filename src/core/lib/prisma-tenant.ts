/**
 * Prisma Client Extension para Tenant Scoping
 *
 * Inyecta automáticamente el filtro de tenantId en las consultas
 * de modelos que requieren aislamiento de datos por tenant.
 *
 * IMPORTANTE: Este extension es ADICIONAL a la validación en los repositorios.
 * Funciona como una capa de seguridad adicional (defense in depth).
 *
 * Modelos con tenant scoping:
 * - UserRole: Los roles de usuario están asociados a un tenant específico
 *
 * @example
 * ```typescript
 * import { prismaWithTenant } from "@/core/lib/prisma";
 * import { runWithTenant } from "@/core/lib/tenant-context";
 *
 * // Las consultas automáticamente filtran por tenantId
 * const result = await runWithTenant(
 *   { tenantId: "tenant-123", userId: "user-456" },
 *   () => prismaWithTenant.userRole.findMany({})
 * );
 * ```
 */

import { PrismaClient } from "../generated/prisma/client";
import { getTenantContext } from "./tenant-context";

/**
 * Tipo para las operaciones de Prisma que soportamos
 */
type PrismaOperation = "findMany" | "findFirst" | "findUnique" | "count";

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
      userRole: {
        /**
         * Intercepta findMany para inyectar tenantId automáticamente
         */
        async findMany({ args, query }) {
          const context = getTenantContext();

          // Solo inyectar si hay contexto Y tenantId está definido
          // Y el where no tiene ya un tenantId explícito
          if (
            context?.tenantId &&
            args.where?.tenantId === undefined
          ) {
            args.where = {
              ...args.where,
              tenantId: context.tenantId,
            };
          }

          return query(args);
        },

        /**
         * Intercepta findFirst para inyectar tenantId automáticamente
         */
        async findFirst({ args, query }) {
          const context = getTenantContext();

          if (
            context?.tenantId &&
            args.where?.tenantId === undefined
          ) {
            args.where = {
              ...args.where,
              tenantId: context.tenantId,
            };
          }

          return query(args);
        },

        /**
         * Intercepta count para inyectar tenantId automáticamente
         */
        async count({ args, query }) {
          const context = getTenantContext();

          if (
            context?.tenantId &&
            args.where?.tenantId === undefined
          ) {
            args.where = {
              ...args.where,
              tenantId: context.tenantId,
            };
          }

          return query(args);
        },
      },
      vacancy: {
        /**
         * Intercepta findMany para inyectar tenantId automáticamente
         */
        async findMany({ args, query }) {
          const context = getTenantContext();

          if (
            context?.tenantId &&
            args.where?.tenantId === undefined
          ) {
            args.where = {
              ...args.where,
              tenantId: context.tenantId,
            };
          }

          return query(args);
        },

        /**
         * Intercepta findFirst para inyectar tenantId automáticamente
         */
        async findFirst({ args, query }) {
          const context = getTenantContext();

          if (
            context?.tenantId &&
            args.where?.tenantId === undefined
          ) {
            args.where = {
              ...args.where,
              tenantId: context.tenantId,
            };
          }

          return query(args);
        },

        /**
         * Intercepta count para inyectar tenantId automáticamente
         */
        async count({ args, query }) {
          const context = getTenantContext();

          if (
            context?.tenantId &&
            args.where?.tenantId === undefined
          ) {
            args.where = {
              ...args.where,
              tenantId: context.tenantId,
            };
          }

          return query(args);
        },
      },
    },
  });
}

/**
 * Tipo del Prisma Client extendido con tenant scoping
 */
export type TenantScopedPrismaClient = ReturnType<typeof createTenantScopedPrisma>;
