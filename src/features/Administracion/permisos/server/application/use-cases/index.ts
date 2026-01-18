/**
 * Use Cases del modulo de Permisos
 *
 * Exporta todos los casos de uso relacionados con la gestion de permisos
 */

// GetAllPermissionsUseCase
export {
  GetAllPermissionsUseCase,
  type GetAllPermissionsInput,
  type GetAllPermissionsOutput,
  type PermissionItem,
  type PermissionsByModule,
} from "./GetAllPermissionsUseCase";

// GetRolePermissionsUseCase
export {
  GetRolePermissionsUseCase,
  type GetRolePermissionsInput,
  type GetRolePermissionsOutput,
} from "./GetRolePermissionsUseCase";

// AssignPermissionsToRoleUseCase
export {
  AssignPermissionsToRoleUseCase,
  type AssignPermissionsToRoleInput,
  type AssignPermissionsToRoleOutput,
} from "./AssignPermissionsToRoleUseCase";
