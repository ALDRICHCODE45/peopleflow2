/**
 * Exportación centralizada de hooks compartidos
 */

export { useAuth } from "./use-auth";
export type { AuthUser, AuthResult, UseAuthReturn } from "./use-auth";

export { usePermissions } from "./use-permissions";
export type { UsePermissionsReturn } from "./use-permissions";

export { useServerPaginatedTable } from "./useServerPaginatedTable";
export type {
  UseServerPaginatedTableOptions,
  UseServerPaginatedTableReturn,
} from "./useServerPaginatedTable";

export { useDebouncedValue } from "./useDebouncedValue";
export { useModalState } from "./useModalState";
export { useMultiModalState } from "./useMultiModalState";
export type { UseMultiModalStateReturn } from "./useMultiModalState";
