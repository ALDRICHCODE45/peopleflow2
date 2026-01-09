import { hasPermission, isSuperAdmin } from "./permission-checker";
import type { AArrowUp } from "@hugeicons/core-free-icons";
import { getRequiredPermission } from "./route-permissions.config";

/**
 * Tipo para los items del sidebar
 * El icono es de tipo IconSvgObject de HugeIcons (inferido del tipo de los iconos)
 */
export type SidebarItem = {
  title: string;
  url: string;
  icon?: typeof AArrowUp;
  items?: {
    title: string;
    url: string;
  }[];
};

/**
 * Filtra los links del sidebar basándose en los permisos del usuario
 *
 * @param links - Array de items del sidebar a filtrar
 * @param userPermissions - Array de permisos del usuario
 * @returns Array de items filtrados (solo los que el usuario puede ver)
 *
 * @example
 * ```tsx
 * const { permissions } = usePermissions();
 *
 * const sidebarLinks: SidebarItem[] = [
 *   {
 *     title: "Facturación",
 *     url: "/facturas",
 *     icon: FileText,
 *     items: [
 *       { title: "Ver Facturas", url: "/facturas" },
 *       { title: "Crear Factura", url: "/facturas/crear" },
 *     ],
 *   },
 * ];
 *
 * const filteredLinks = filterSidebarLinks(sidebarLinks, permissions);
 * ```
 */
export function filterSidebarLinks(
  links: SidebarItem[],
  userPermissions: string[]
): SidebarItem[] {
  // Si el usuario es super admin, mostrar todos los links
  if (isSuperAdmin(userPermissions)) {
    return links;
  }

  // Filtrar cada módulo
  const filteredModules: SidebarItem[] = [];

  for (const modulo of links) {
    // Si el módulo tiene subitems, filtrarlos
    if (modulo.items && modulo.items.length > 0) {
      const filteredItems = modulo.items.filter((item) => {
        // Obtener el permiso requerido para esta ruta
        const requiredPermission = getRequiredPermission(item.url);

        // Si la ruta no requiere permisos específicos, permitir acceso
        if (!requiredPermission) {
          return true;
        }

        // Verificar si el usuario tiene el permiso requerido
        return hasPermission(userPermissions, requiredPermission);
      });

      // Agregar el módulo solo si tiene items visibles
      if (filteredItems.length > 0) {
        filteredModules.push({
          ...modulo,
          items: filteredItems,
        });
      }
    } else {
      // Si el módulo no tiene subitems, verificar el permiso del módulo directamente
      const requiredPermission = getRequiredPermission(modulo.url);

      // Si no requiere permisos específicos o el usuario los tiene, incluirlo
      if (
        !requiredPermission ||
        hasPermission(userPermissions, requiredPermission)
      ) {
        filteredModules.push(modulo);
      }
    }
  }

  return filteredModules;
}

/**
 * Verifica si el usuario puede ver al menos un item de un módulo del sidebar
 *
 * @param modulo - Módulo del sidebar a verificar
 * @param userPermissions - Array de permisos del usuario
 * @returns true si el usuario puede ver al menos un item
 */
export function canViewModule(
  modulo: SidebarItem,
  userPermissions: string[]
): boolean {
  // Super admin puede ver todo
  if (isSuperAdmin(userPermissions)) {
    return true;
  }

  // Si no tiene subitems, verificar el permiso del módulo
  if (!modulo.items || modulo.items.length === 0) {
    const requiredPermission = getRequiredPermission(modulo.url);
    return (
      !requiredPermission || hasPermission(userPermissions, requiredPermission)
    );
  }

  // Si tiene subitems, verificar si puede ver al menos uno
  return modulo.items.some((item) => {
    const requiredPermission = getRequiredPermission(item.url);
    return (
      !requiredPermission || hasPermission(userPermissions, requiredPermission)
    );
  });
}

/**
 * Verifica si el usuario puede acceder a una ruta específica
 *
 * @param path - Ruta a verificar
 * @param userPermissions - Array de permisos del usuario
 * @returns true si el usuario puede acceder
 */
export function canAccessRoute(
  path: string,
  userPermissions: string[]
): boolean {
  // Super admin puede acceder a todo
  if (isSuperAdmin(userPermissions)) {
    return true;
  }

  const requiredPermission = getRequiredPermission(path);

  // Si no requiere permisos específicos, permitir acceso
  if (!requiredPermission) {
    return true;
  }

  return hasPermission(userPermissions, requiredPermission);
}
