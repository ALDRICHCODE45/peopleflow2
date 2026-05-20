import { getCurrentTenantAction } from "@features/tenants/server/presentation/actions/tenant.actions";

export async function getActiveTenantId(): Promise<string | null> {
  const result = await getCurrentTenantAction();
  return result.tenant?.id ?? null;
}
