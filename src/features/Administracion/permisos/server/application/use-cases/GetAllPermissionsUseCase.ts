import { prismaPermissionRepository } from "../../infrastructure/repositories/PrismaPermissionRepository";
import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";

/**
 * Caso de uso: Obtener todos los permisos del sistema agrupados por recurso
 *
 * Retorna todos los permisos de la BD organizados por módulo/recurso
 * para facilitar la visualización en la UI de gestión de roles.
 * SEGURIDAD: Excluye el permiso super:admin de la lista visible.
 */

export interface GetAllPermissionsInput {
  // No requiere inputs - obtiene todos los permisos
}

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

export interface GetAllPermissionsOutput {
  success: boolean;
  error?: string;
  permissions: PermissionsByModule;
}

export class GetAllPermissionsUseCase {
  async execute(): Promise<GetAllPermissionsOutput> {
    try {
      // Obtener todos los permisos de la BD
      const allPermissions = await prismaPermissionRepository.findAll();

      // SEGURIDAD: Filtrar el permiso super:admin (no debe ser visible ni asignable)
      const permissions = allPermissions.filter(
        (p) => p.name !== SUPER_ADMIN_PERMISSION_NAME
      );

      // Agrupar permisos por recurso
      const permissionsByModule: PermissionsByModule = {};

      for (const permission of permissions) {
        const resource = permission.resource;

        if (!permissionsByModule[resource]) {
          permissionsByModule[resource] = [];
        }

        permissionsByModule[resource].push({
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
        });
      }

      return {
        success: true,
        permissions: permissionsByModule,
      };
    } catch (error) {
      console.error("Error in GetAllPermissionsUseCase:", error);
      return {
        success: false,
        error: "Error al obtener los permisos del sistema",
        permissions: {},
      };
    }
  }
}
