/**
 * Tipos para el módulo de Roles
 */

export interface RoleWithStats {
  id: string;
  name: string;
  permissionsCount: number;
  usersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleData {
  name: string;
}

export interface UpdateRoleData {
  name: string;
}

// Result types from server actions
export interface GetRolesWithStatsResult {
  error: string | null;
  roles: RoleWithStats[];
}

export interface CreateRoleResult {
  error: string | null;
  role?: { id: string; name: string; createdAt: Date; updatedAt: Date };
}

export interface UpdateRoleResult {
  error: string | null;
  role?: { id: string; name: string; createdAt: Date; updatedAt: Date };
}

export interface DeleteRoleResult {
  error: string | null;
  success: boolean;
}
