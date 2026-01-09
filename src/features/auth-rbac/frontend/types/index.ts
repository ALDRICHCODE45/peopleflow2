/**
 * Tipos compartidos para la feature de Auth RBAC
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  image: string | null;
}

export interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  roles: Array<{ id: string; name: string }>;
}

export interface Role {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string | null;
  user: User;
  role: Role;
  createdAt: Date;
}

// Tipos de respuesta para las actions
export interface CheckPermissionResult {
  hasPermission: boolean;
}

export interface GetUserPermissionsResult {
  error: string | null;
  permissions: string[];
}

export interface CreateUserResult {
  error: string | null;
  user?: User;
}

export interface AssignUserToTenantResult {
  error: string | null;
  userRole?: UserRole;
}

export interface GetTenantUsersResult {
  error: string | null;
  users: UserWithRoles[];
}

// Tipos de rol predefinidos
export type RoleName = "capturador" | "gerente" | "superadmin";

// Tipos de permisos predefinidos
export type PermissionName =
  | "facturas:acceder"
  | "facturas:crear"
  | "colaboradores:acceder"
  | "colaboradores:crear"
  | "colaboradores:editar"
  | "*";
