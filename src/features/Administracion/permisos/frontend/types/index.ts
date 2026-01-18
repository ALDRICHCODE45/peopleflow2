/**
 * Tipos para el módulo de Permisos
 */

export interface PermissionItem {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface PermissionsByModule {
  [resource: string]: PermissionItem[];
}

// Result types from server actions
export interface GetAllPermissionsResult {
  error: string | null;
  permissions: PermissionsByModule;
}

export interface GetRolePermissionsResult {
  error: string | null;
  permissionIds: string[];
}

export interface AssignPermissionsResult {
  error: string | null;
  success: boolean;
}
