"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInvitableTenantsAction,
  getAvailableRolesAction,
  inviteUserToTenantAction,
} from "../../server/presentation/actions/user.actions";
import type { InvitableTenant } from "../types";
import { getUsersQueryKey } from "./useUsers";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";

// Query Key Factories
export const getInvitableTenantsQueryKey = () => ["invitable-tenants"] as const;
export const getTenantRolesQueryKey = (tenantId: string) =>
  ["tenant-roles", tenantId] as const;

/**
 * Hook para obtener los tenants a los que se puede invitar usuarios
 */
export function useInvitableTenantsQuery() {
  return useQuery({
    queryKey: getInvitableTenantsQueryKey(),
    queryFn: async (): Promise<InvitableTenant[]> => {
      const result = await getInvitableTenantsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.tenants;
    },
  });
}

/**
 * Hook para obtener los roles de un tenant especifico
 * Se usa para mostrar los roles del tenant DESTINO en el dialog de invitacion
 */
export function useTenantRolesQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId
      ? getTenantRolesQueryKey(tenantId)
      : ["tenant-roles", "no-tenant"],
    queryFn: async () => {
      if (!tenantId) {
        return [];
      }
      const result = await getAvailableRolesAction(tenantId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.roles;
    },
    enabled: !!tenantId,
  });
}

/**
 * Hook para invitar un usuario a un tenant
 */
export function useInviteToTenant() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      tenantId: string;
      roleIds: string[];
    }) => {
      const result = await inviteUserToTenantAction(data);
      if (!result.success) {
        throw new Error(result.error || "Error al invitar usuario");
      }
      return result;
    },
    onSuccess: async () => {
      showToast({
        title: "Operacion Exitosa",
        description: "Usuario invitado exitosamente",
        type: "success",
      });
      // Invalidar queries relacionadas
      if (tenant?.id) {
        await queryClient.invalidateQueries({
          queryKey: getUsersQueryKey(tenant.id),
        });
        await queryClient.invalidateQueries({
          queryKey: ["users", "paginated", tenant.id],
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Ocurrió un Error",
        description: "Error al invitar usuario",
        type: "error",
      });
    },
  });
}
