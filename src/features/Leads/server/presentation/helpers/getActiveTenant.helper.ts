import { getCurrentTenantAction } from "@/features/tenants/server/presentation/actions/tenant.actions";

/**
 * Helper interno para obtener el tenant activo de la sesión
 */
export async function getActiveTenantId(): Promise<string | null> {
  const result = await getCurrentTenantAction();
  return result.tenant?.id ?? null;
}
