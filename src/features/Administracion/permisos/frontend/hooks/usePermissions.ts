"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllPermissionsAction,
  getRolePermissionsAction,
  assignPermissionsToRoleAction,
} from "../../server/presentation/actions/permission.actions";
import type { PermissionsByModule } from "../types";
import { ROLES_QUERY_KEY } from "@/features/Administracion/roles/frontend/hooks/useRoles";

// Query Keys
export const ALL_PERMISSIONS_QUERY_KEY = ["all-permissions"] as const;
export const ROLE_PERMISSIONS_QUERY_KEY = ["role-permissions"] as const;

/**
 * Hook para obtener todos los permisos agrupados por módulo
 */
export function useAllPermissionsQuery() {
  return useQuery({
    queryKey: ALL_PERMISSIONS_QUERY_KEY,
    queryFn: async (): Promise<PermissionsByModule> => {
      const result = await getAllPermissionsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.permissions;
    },
  });
}

/**
 * Hook para obtener los permisos asignados a un rol
 */
export function useRolePermissionsQuery(roleId: string | null) {
  return useQuery({
    queryKey: [...ROLE_PERMISSIONS_QUERY_KEY, roleId],
    queryFn: async (): Promise<string[]> => {
      if (!roleId) return [];
      const result = await getRolePermissionsAction(roleId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.permissionIds;
    },
    enabled: !!roleId,
  });
}

/**
 * Hook para asignar permisos a un rol
 */
export function useAssignPermissionsToRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      permissionIds,
    }: {
      roleId: string;
      permissionIds: string[];
    }) => {
      const result = await assignPermissionsToRoleAction(roleId, permissionIds);
      if (!result.success) {
        throw new Error(result.error || "Error al asignar permisos");
      }
      return result;
    },
    onSuccess: async (_, variables) => {
      toast.success("Permisos asignados exitosamente");
      await queryClient.invalidateQueries({
        queryKey: [...ROLE_PERMISSIONS_QUERY_KEY, variables.roleId],
      });
      await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al asignar permisos");
    },
  });
}
