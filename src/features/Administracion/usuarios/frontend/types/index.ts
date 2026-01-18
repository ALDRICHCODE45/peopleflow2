/**
 * Tipos para el módulo de Usuarios
 */

export interface TenantUser {
  id: string;
  email: string;
  name: string | null;
  roles: Array<{ id: string; name: string }>;
  createdAt?: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  roleId?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}

// Result types from server actions
export interface GetTenantUsersResult {
  error: string | null;
  users: TenantUser[];
}

export interface CreateUserResult {
  error: string | null;
  user?: { id: string; email: string; name: string | null };
}

export interface UpdateUserResult {
  error: string | null;
  user?: { id: string; email: string; name: string | null };
}

export interface DeleteUserResult {
  error: string | null;
  success: boolean;
}

export interface UpdateUserRolesResult {
  error: string | null;
  success: boolean;
  roles?: Array<{ id: string; name: string }>;
}

export interface GetRolesResult {
  error: string | null;
  roles: Array<{ id: string; name: string }>;
}
