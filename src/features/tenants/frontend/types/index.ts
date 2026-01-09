/**
 * Tipos compartidos para la feature de Tenants
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantWithRoles extends Tenant {
  roles: Role[];
}

export interface Role {
  id: string;
  name: string;
}

export interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// Tipos de respuesta para las actions
export interface GetUserTenantsResult {
  error: string | null;
  tenants: TenantWithRoles[];
}

export interface CreateTenantResult {
  error: string | null;
  tenant?: Tenant;
}

export interface SwitchTenantResult {
  error: string | null;
}

export interface GetCurrentTenantResult {
  error: string | null;
  tenant: Tenant | null;
}
