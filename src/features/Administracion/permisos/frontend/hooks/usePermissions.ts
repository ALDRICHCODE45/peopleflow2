"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllPermissionsAction,
  getRolePermissionsAction,
  assignPermissionsToRoleAction,
} from "../../server/presentation/actions/permission.actions";
import type { PermissionsByModule } from "../types";
import { getRolesQueryKey } from "@/features/Administracion/roles/frontend/hooks/useRoles";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";

// Query Key Factories - Incluyen tenantId para evitar cache stale entre tenants
export const getAllPermissionsQueryKey = (tenantId: string) =>
  ["all-permissions", tenantId] as const;
export const getRolePermissionsQueryKey = (
  tenantId: string,
  roleId: string | null
) => ["role-permissions", tenantId, roleId] as const;

/**
 * Hook para obtener todos los permisos agrupados por módulo
 */
export function useAllPermissionsQuery() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getAllPermissionsQueryKey(tenant.id)
      : ["all-permissions", "no-tenant"],
    queryFn: async (): Promise<PermissionsByModule> => {
      const result = await getAllPermissionsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.permissions;
    },
    enabled: !!tenant?.id,
  });
}

/**
 * Hook para obtener los permisos asignados a un rol
 */
export function useRolePermissionsQuery(roleId: string | null) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getRolePermissionsQueryKey(tenant.id, roleId)
      : ["role-permissions", "no-tenant", roleId],
    queryFn: async (): Promise<string[]> => {
      if (!roleId) return [];
      const result = await getRolePermissionsAction(roleId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.permissionIds;
    },
    enabled: !!roleId && !!tenant?.id,
  });
}

/**
 * Hook para asignar permisos a un rol
 */
export function useAssignPermissionsToRole() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

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
      showToast({
        title: "Operacion Exitosa",
        description: "Permisos asignados exitosamente",
        type: "success",
      });
      if (tenant?.id) {
        await queryClient.invalidateQueries({
          queryKey: getRolePermissionsQueryKey(tenant.id, variables.roleId),
        });
        await queryClient.invalidateQueries({
          queryKey: getRolesQueryKey(tenant.id),
        });
        await queryClient.invalidateQueries({
          queryKey: ["roles", "paginated", tenant.id],
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Ocurrió un Error",
        description: "Error al asignar permisos",
        type: "error",
      });
    },
  });
}
