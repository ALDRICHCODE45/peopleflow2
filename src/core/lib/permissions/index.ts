/**
 * Módulo de permisos para middleware/proxy
 *
 * Exporta todos los servicios y utilidades de permisos
 */

export { MiddlewarePermissionsService } from "./middleware-permissions.service";
export { RoutePermissionGuard, type AccessCheckResult } from "./route-permission-guard";
export {
  getDefaultRoute,
  shouldRedirectToSuperAdmin,
  getFirstAccessibleRoute,
  DEFAULT_ROUTES,
} from "./get-default-route";
