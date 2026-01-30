/**
 * Sistema de permisos predefinidos del sistema
 * Formato híbrido: granular (recurso:acción) y modular (recurso:gestionar)
 *
 * Módulos: Administración, Finanzas, Reclutamiento, Sistema, Ventas
 */

export type PermissionDefinition = {
  name: string;
  resource: string;
  action: string;
  description: string;
};

/**
 * Permisos del módulo de Administración
 */
const ADMINISTRACION_PERMISSIONS: PermissionDefinition[] = [
  // Usuarios - Granulares
  {
    name: "usuarios:acceder",
    resource: "usuarios",
    action: "acceder",
    description: "Acceder al módulo de usuarios",
  },
  {
    name: "usuarios:crear",
    resource: "usuarios",
    action: "crear",
    description: "Crear nuevos usuarios",
  },
  {
    name: "usuarios:editar",
    resource: "usuarios",
    action: "editar",
    description: "Editar usuarios existentes",
  },
  {
    name: "usuarios:eliminar",
    resource: "usuarios",
    action: "eliminar",
    description: "Eliminar usuarios",
  },
  {
    name: "usuarios:asignar-roles",
    resource: "usuarios",
    action: "asignar-roles",
    description: "Asignar roles a usuarios",
  },
  // Usuarios - Modular
  {
    name: "usuarios:gestionar",
    resource: "usuarios",
    action: "gestionar",
    description:
      "Gestionar completamente el módulo de usuarios (incluye todas las acciones)",
  },
  {
    name: "usuarios:invitar-tenant",
    resource: "usuarios",
    action: "invitar-tenant",
    description: "Invitar usuarios a otros tenants",
  },

  // Roles - Granulares
  {
    name: "roles:acceder",
    resource: "roles",
    action: "acceder",
    description: "Acceder al módulo de roles",
  },
  {
    name: "roles:crear",
    resource: "roles",
    action: "crear",
    description: "Crear nuevos roles",
  },
  {
    name: "roles:editar",
    resource: "roles",
    action: "editar",
    description: "Editar roles existentes",
  },
  {
    name: "roles:eliminar",
    resource: "roles",
    action: "eliminar",
    description: "Eliminar roles",
  },
  {
    name: "roles:asignar-permisos",
    resource: "roles",
    action: "asignar-permisos",
    description: "Asignar permisos a roles",
  },
  // Roles - Modular
  {
    name: "roles:gestionar",
    resource: "roles",
    action: "gestionar",
    description:
      "Gestionar completamente el módulo de roles (incluye todas las acciones)",
  },
];

/**
 * Permisos del módulo de Finanzas
 */
const FINANZAS_PERMISSIONS: PermissionDefinition[] = [
  // Ingresos - Granulares
  {
    name: "ingresos:acceder",
    resource: "ingresos",
    action: "acceder",
    description: "Acceder al módulo de ingresos",
  },
  {
    name: "ingresos:crear",
    resource: "ingresos",
    action: "crear",
    description: "Crear nuevos ingresos",
  },
  {
    name: "ingresos:editar",
    resource: "ingresos",
    action: "editar",
    description: "Editar ingresos existentes",
  },
  {
    name: "ingresos:eliminar",
    resource: "ingresos",
    action: "eliminar",
    description: "Eliminar ingresos",
  },
  // Ingresos - Modular
  {
    name: "ingresos:gestionar",
    resource: "ingresos",
    action: "gestionar",
    description:
      "Gestionar completamente el módulo de ingresos (incluye todas las acciones)",
  },

  // Egresos - Granulares
  {
    name: "egresos:acceder",
    resource: "egresos",
    action: "acceder",
    description: "Acceder al módulo de egresos",
  },
  {
    name: "egresos:crear",
    resource: "egresos",
    action: "crear",
    description: "Crear nuevos egresos",
  },
  {
    name: "egresos:editar",
    resource: "egresos",
    action: "editar",
    description: "Editar egresos existentes",
  },
  {
    name: "egresos:eliminar",
    resource: "egresos",
    action: "eliminar",
    description: "Eliminar egresos",
  },
  // Egresos - Modular
  {
    name: "egresos:gestionar",
    resource: "egresos",
    action: "gestionar",
    description:
      "Gestionar completamente el módulo de egresos (incluye todas las acciones)",
  },
];

/**
 * Permisos del módulo de Reclutamiento
 */
const RECLUTAMIENTO_PERMISSIONS: PermissionDefinition[] = [
  // Vacantes - Granulares
  {
    name: "vacantes:acceder",
    resource: "vacantes",
    action: "acceder",
    description: "Acceder al módulo de vacantes",
  },
  {
    name: "vacantes:crear",
    resource: "vacantes",
    action: "crear",
    description: "Crear nuevas vacantes",
  },
  {
    name: "vacantes:editar",
    resource: "vacantes",
    action: "editar",
    description: "Editar vacantes existentes",
  },
  {
    name: "vacantes:eliminar",
    resource: "vacantes",
    action: "eliminar",
    description: "Eliminar vacantes",
  },
  // Vacantes - Modular
  {
    name: "vacantes:gestionar",
    resource: "vacantes",
    action: "gestionar",
    description:
      "Gestionar completamente el módulo de vacantes (incluye todas las acciones)",
  },

  // Candidatos - Granulares
  {
    name: "candidatos:acceder",
    resource: "candidatos",
    action: "acceder",
    description: "Acceder al módulo de candidatos",
  },
  {
    name: "candidatos:crear",
    resource: "candidatos",
    action: "crear",
    description: "Crear nuevos candidatos",
  },
  {
    name: "candidatos:editar",
    resource: "candidatos",
    action: "editar",
    description: "Editar candidatos existentes",
  },
  {
    name: "candidatos:eliminar",
    resource: "candidatos",
    action: "eliminar",
    description: "Eliminar candidatos",
  },
  // Candidatos - Modular
  {
    name: "candidatos:gestionar",
    resource: "candidatos",
    action: "gestionar",
    description:
      "Gestionar completamente el módulo de candidatos (incluye todas las acciones)",
  },

  // Reportes Reclutamiento - Granulares
  {
    name: "reportes-reclutamiento:acceder",
    resource: "reportes-reclutamiento",
    action: "acceder",
    description: "Acceder a los reportes de reclutamiento",
  },
  {
    name: "reportes-reclutamiento:exportar",
    resource: "reportes-reclutamiento",
    action: "exportar",
    description: "Exportar reportes de reclutamiento",
  },
  // Reportes Reclutamiento - Modular
  {
    name: "reportes-reclutamiento:gestionar",
    resource: "reportes-reclutamiento",
    action: "gestionar",
    description:
      "Gestionar completamente los reportes de reclutamiento (incluye todas las acciones)",
  },
];

/**
 * Permisos del módulo de Sistema
 */
const SISTEMA_PERMISSIONS: PermissionDefinition[] = [
  // Configuración - Granulares
  {
    name: "configuracion:acceder",
    resource: "configuracion",
    action: "acceder",
    description: "Acceder a la configuración del sistema",
  },
  {
    name: "configuracion:editar",
    resource: "configuracion",
    action: "editar",
    description: "Editar la configuración del sistema",
  },
  // Configuración - Modular
  {
    name: "configuracion:gestionar",
    resource: "configuracion",
    action: "gestionar",
    description:
      "Gestionar completamente la configuración del sistema (incluye todas las acciones)",
  },

  // Actividad - Granulares
  {
    name: "actividad:acceder",
    resource: "actividad",
    action: "acceder",
    description: "Acceder al registro de actividad del sistema",
  },
  {
    name: "actividad:exportar",
    resource: "actividad",
    action: "exportar",
    description: "Exportar el registro de actividad",
  },
  // Actividad - Modular
  {
    name: "actividad:gestionar",
    resource: "actividad",
    action: "gestionar",
    description:
      "Gestionar completamente el registro de actividad (incluye todas las acciones)",
  },
];

/**
 * Permisos del módulo de Ventas
 */
const VENTAS_PERMISSIONS: PermissionDefinition[] = [
  // Leads - Granulares
  {
    name: "leads:acceder",
    resource: "leads",
    action: "acceder",
    description: "Acceder al módulo de leads",
  },
  {
    name: "leads:crear",
    resource: "leads",
    action: "crear",
    description: "Crear nuevos leads",
  },
  {
    name: "leads:editar",
    resource: "leads",
    action: "editar",
    description: "Editar leads existentes",
  },
  {
    name: "leads:eliminar",
    resource: "leads",
    action: "eliminar",
    description: "Eliminar leads",
  },
  // Leads - Modular
  {
    name: "leads:gestionar",
    resource: "leads",
    action: "gestionar",
    description:
      "Gestionar completamente el módulo de leads (incluye todas las acciones)",
  },

  // Reportes Ventas - Granulares
  {
    name: "reportes-ventas:acceder",
    resource: "reportes-ventas",
    action: "acceder",
    description: "Acceder a los reportes de ventas",
  },
  {
    name: "reportes-ventas:exportar",
    resource: "reportes-ventas",
    action: "exportar",
    description: "Exportar reportes de ventas",
  },
  // Reportes Ventas - Modular
  {
    name: "reportes-ventas:gestionar",
    resource: "reportes-ventas",
    action: "gestionar",
    description:
      "Gestionar completamente los reportes de ventas (incluye todas las acciones)",
  },
];

/**
 * Permiso especial de super administrador
 */
const SUPER_ADMIN_PERMISSION: PermissionDefinition = {
  name: "super:admin",
  resource: "super",
  action: "admin",
  description: "Acceso total al sistema (super administrador)",
};

/**
 * Todos los permisos del sistema
 */
export const ALL_PERMISSIONS: PermissionDefinition[] = [
  ...ADMINISTRACION_PERMISSIONS,
  ...FINANZAS_PERMISSIONS,
  ...RECLUTAMIENTO_PERMISSIONS,
  ...SISTEMA_PERMISSIONS,
  ...VENTAS_PERMISSIONS,
  SUPER_ADMIN_PERMISSION,
];

/**
 * Permisos agrupados por módulo
 */
export const PERMISSIONS_BY_MODULE = {
  administracion: ADMINISTRACION_PERMISSIONS,
  finanzas: FINANZAS_PERMISSIONS,
  reclutamiento: RECLUTAMIENTO_PERMISSIONS,
  sistema: SISTEMA_PERMISSIONS,
  ventas: VENTAS_PERMISSIONS,
  super: [SUPER_ADMIN_PERMISSION],
};

/**
 * Obtener todos los nombres de permisos
 */
export function getAllPermissionNames(): string[] {
  return ALL_PERMISSIONS.map((p) => p.name);
}

/**
 * Obtener permisos por recurso
 */
export function getPermissionsByResource(
  resource: string
): PermissionDefinition[] {
  return ALL_PERMISSIONS.filter((p) => p.resource === resource);
}

/**
 * Verificar si un permiso es modular (gestionar)
 */
export function isModularPermission(permissionName: string): boolean {
  return (
    permissionName.endsWith(":gestionar") || permissionName === "super:admin"
  );
}

/**
 * Obtener todas las acciones de un recurso (para permisos modulares)
 */
export function getResourceActions(resource: string): string[] {
  const permissions = getPermissionsByResource(resource);
  return permissions
    .filter((p) => p.action !== "gestionar" && p.action !== "acceder")
    .map((p) => p.action);
}

/**
 * Obtener permiso por nombre
 */
export function getPermissionByName(
  name: string
): PermissionDefinition | undefined {
  return ALL_PERMISSIONS.find((p) => p.name === name);
}

/**
 * Constante para el permiso de super admin
 */
export const SUPER_ADMIN_PERMISSION_NAME = "super:admin";

/**
 * Nombre del rol de super admin (oculto en UIs normales)
 */
export const HIDDEN_ADMIN_ROLE_NAME = "administrador";

/**
 * Objeto para acceso type-safe a permisos
 * Permite autocompletado en el IDE y validación en tiempo de compilación
 *
 * @example
 * ```tsx
 * import { PermissionActions } from "@/core/shared/constants/permissions";
 *
 * <PermissionGuard
 *   permissions={[
 *     PermissionActions.usuarios.acceder,
 *     PermissionActions.usuarios.gestionar,
 *   ]}
 * >
 *   <DataTable columns={columns} data={data} />
 * </PermissionGuard>
 * ```
 */
export const PermissionActions = {
  // Módulo: Administración
  usuarios: {
    acceder: "usuarios:acceder",
    crear: "usuarios:crear",
    editar: "usuarios:editar",
    eliminar: "usuarios:eliminar",
    asignarRoles: "usuarios:asignar-roles",
    gestionar: "usuarios:gestionar",
    invitarTenant: "usuarios:invitar-tenant",
  },
  roles: {
    acceder: "roles:acceder",
    crear: "roles:crear",
    editar: "roles:editar",
    eliminar: "roles:eliminar",
    asignarPermisos: "roles:asignar-permisos",
    gestionar: "roles:gestionar",
  },

  // Módulo: Finanzas
  ingresos: {
    acceder: "ingresos:acceder",
    crear: "ingresos:crear",
    editar: "ingresos:editar",
    eliminar: "ingresos:eliminar",
    gestionar: "ingresos:gestionar",
  },
  egresos: {
    acceder: "egresos:acceder",
    crear: "egresos:crear",
    editar: "egresos:editar",
    eliminar: "egresos:eliminar",
    gestionar: "egresos:gestionar",
  },

  // Módulo: Reclutamiento
  vacantes: {
    acceder: "vacantes:acceder",
    crear: "vacantes:crear",
    editar: "vacantes:editar",
    eliminar: "vacantes:eliminar",
    gestionar: "vacantes:gestionar",
  },
  candidatos: {
    acceder: "candidatos:acceder",
    crear: "candidatos:crear",
    editar: "candidatos:editar",
    eliminar: "candidatos:eliminar",
    gestionar: "candidatos:gestionar",
  },
  reportesReclutamiento: {
    acceder: "reportes-reclutamiento:acceder",
    exportar: "reportes-reclutamiento:exportar",
    gestionar: "reportes-reclutamiento:gestionar",
  },

  // Módulo: Sistema
  configuracion: {
    acceder: "configuracion:acceder",
    editar: "configuracion:editar",
    gestionar: "configuracion:gestionar",
  },
  actividad: {
    acceder: "actividad:acceder",
    exportar: "actividad:exportar",
    gestionar: "actividad:gestionar",
  },

  // Módulo: Ventas
  leads: {
    acceder: "leads:acceder",
    crear: "leads:crear",
    editar: "leads:editar",
    eliminar: "leads:eliminar",
    gestionar: "leads:gestionar",
  },
  reportesVentas: {
    acceder: "reportes-ventas:acceder",
    exportar: "reportes-ventas:exportar",
    gestionar: "reportes-ventas:gestionar",
  },

  // Super Admin
  super: {
    admin: "super:admin",
  },
} as const;

/**
 * Tipo helper para extraer valores de un objeto anidado
 */
type NestedValues<T> = T extends object
  ? { [K in keyof T]: T[K] extends object ? NestedValues<T[K]> : T[K] }[keyof T]
  : T;

/**
 * Tipo para todos los permisos válidos del sistema
 * Útil para tipar parámetros que aceptan permisos
 */
export type PermissionName = NestedValues<typeof PermissionActions>;
