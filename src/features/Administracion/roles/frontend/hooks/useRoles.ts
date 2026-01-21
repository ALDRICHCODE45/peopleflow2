"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getRolesWithStatsAction,
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
} from "../../server/presentation/actions/role.actions";
import type { RoleWithStats } from "../types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";

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
      toast.success("Rol creado exitosamente");
      if (tenant?.id) {
        await queryClient.invalidateQueries({
          queryKey: getRolesQueryKey(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear rol");
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
      toast.success("Rol actualizado exitosamente");
      if (tenant?.id) {
        await queryClient.invalidateQueries({
          queryKey: getRolesQueryKey(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar rol");
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
      toast.success("Rol eliminado exitosamente");
      if (tenant?.id) {
        await queryClient.invalidateQueries({
          queryKey: getRolesQueryKey(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar rol");
    },
  });
}
