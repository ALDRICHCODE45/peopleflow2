/**
 * Contexto de Tenant usando AsyncLocalStorage
 *
 * Permite propagar el tenantId a través del stack de llamadas sin
 * tener que pasarlo explícitamente como parámetro.
 *
 * Útil para:
 * - Inyectar automáticamente el tenantId en consultas Prisma
 * - Logging con contexto de tenant
 * - Auditoría de acciones por tenant
 *
 * @example
 * ```typescript
 * // En un Server Action o API Route
 * import { runWithTenant, getTenantContext } from "@/core/lib/tenant-context";
 *
 * export async function myAction() {
 *   const session = await auth.api.getSession({ headers: await headers() });
 *   const tenantId = session?.session?.activeTenantId;
 *
 *   return runWithTenant(
 *     { tenantId, userId: session?.user?.id ?? null },
 *     async () => {
 *       // Aquí getTenantContext() retornará el contexto
 *       const data = await prismaWithTenant.userRole.findMany({});
 *       return data;
 *     }
 *   );
 * }
 * ```
 */

import { AsyncLocalStorage } from "async_hooks";

/**
 * Interfaz del contexto de tenant
 */
export interface TenantContext {
  /** ID del tenant activo (null para superadmin o sin tenant) */
  tenantId: string | null;
  /** ID del usuario actual */
  userId: string | null;
}

/**
 * Storage asíncrono para el contexto de tenant
 * Persiste a través de llamadas async/await
 */
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Obtiene el contexto de tenant actual
 *
 * @returns El contexto de tenant o undefined si no está establecido
 */
export function getTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}

/**
 * Obtiene el tenantId del contexto actual
 *
 * @returns El tenantId o null si no hay contexto
 */
export function getCurrentTenantId(): string | null {
  const context = getTenantContext();
  return context?.tenantId ?? null;
}

/**
 * Obtiene el userId del contexto actual
 *
 * @returns El userId o null si no hay contexto
 */
export function getCurrentUserId(): string | null {
  const context = getTenantContext();
  return context?.userId ?? null;
}

/**
 * Ejecuta una función con un contexto de tenant específico
 *
 * @param context - Contexto de tenant a establecer
 * @param fn - Función a ejecutar con el contexto
 * @returns El resultado de la función
 */
export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return tenantStorage.run(context, fn);
}

/**
 * Ejecuta una función async con un contexto de tenant específico
 *
 * @param context - Contexto de tenant a establecer
 * @param fn - Función async a ejecutar con el contexto
 * @returns Promise con el resultado de la función
 */
export async function runWithTenantAsync<T>(
  context: TenantContext,
  fn: () => Promise<T>
): Promise<T> {
  return tenantStorage.run(context, fn);
}

/**
 * Verifica si hay un contexto de tenant activo
 *
 * @returns true si hay un contexto establecido
 */
export function hasTenantContext(): boolean {
  return getTenantContext() !== undefined;
}

/**
 * Verifica si el contexto actual tiene un tenant específico (no es superadmin)
 *
 * @returns true si hay un tenantId establecido
 */
export function hasActiveTenant(): boolean {
  const context = getTenantContext();
  return context?.tenantId !== null && context?.tenantId !== undefined;
}
