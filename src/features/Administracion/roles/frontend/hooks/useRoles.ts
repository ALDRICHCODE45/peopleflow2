"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRolesWithStatsAction,
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
} from "../../server/presentation/actions/role.actions";
import type { RoleWithStats } from "../types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";

// Query Key Factory - Incluye tenantId para evitar cache stale entre tenants
export const getRolesQueryKey = (tenantId: string) =>
  ["roles-with-stats", tenantId] as const;

/**
 * Hook para obtener los roles con estadísticas
 */
export function useRolesWithStatsQuery() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getRolesQueryKey(tenant.id)
      : ["roles-with-stats", "no-tenant"],
    queryFn: async (): Promise<RoleWithStats[]> => {
      const result = await getRolesWithStatsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.roles;
    },
    enabled: !!tenant?.id,
  });
}

/**
 * Hook para crear un rol
 */
export function useCreateRole() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (name: string) => {
      const result = await createRoleAction(name);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.role;
    },
    onSuccess: async () => {
      showToast({
        title: "Operacion Exitosa",
        description: "Role creado exitosamente.",
        type: "success",
      });
      if (tenant?.id) {
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
        title: "Error",
        description: "El role no se pude crear correctamente",
        type: "error",
      });
    },
  });
}

/**
 * Hook para actualizar un rol
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ roleId, name }: { roleId: string; name: string }) => {
      const result = await updateRoleAction(roleId, name);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.role;
    },
    onSuccess: async () => {
      showToast({
        title: "Operacion Exitosa",
        description: "El role ha sido actualizado correctamente",
        type: "success",
      });
      if (tenant?.id) {
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
        title: "Ah ocurrido un error",
        description: "Ha ocurrido un problema actualizando el role",
        type: "error",
      });
    },
  });
}

/**
 * Hook para eliminar un rol
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const result = await deleteRoleAction(roleId);
      if (!result.success) {
        throw new Error(result.error || "Error al eliminar rol");
      }
      return result;
    },
    onSuccess: async () => {
      showToast({
        title: "Role eliminado",
        description: "El role fue eliminado exitosamente.",
        type: "success",
      });
      if (tenant?.id) {
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
        title: "Error",
        description: "Ha ocurrido un problema eliminando el role",
        type: "error",
      });
    },
  });
}
