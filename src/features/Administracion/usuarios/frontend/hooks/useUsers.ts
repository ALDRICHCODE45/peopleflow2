"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTenantUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserFromTenantAction,
  updateUserRolesAction,
  getAvailableRolesAction,
  toggleUserActiveAction,
} from "../../server/presentation/actions/user.actions";
import type { TenantUser, CreateUserData, UpdateUserData } from "../types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { usersQueryKeys } from "@core/shared/constants/query-keys";

// Query Key Factories - Incluyen tenantId para evitar cache stale entre tenants
export const getUsersQueryKey = (tenantId: string) =>
  ["tenant-users", tenantId] as const;
export const getAvailableRolesQueryKey = (tenantId: string) =>
  ["available-roles", tenantId] as const;

/**
 * Hook para obtener los usuarios del tenant actual
 */
export function useTenantUsersQuery() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getUsersQueryKey(tenant.id)
      : ["tenant-users", "no-tenant"],
    queryFn: async (): Promise<TenantUser[]> => {
      const result = await getTenantUsersAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.users;
    },
    enabled: !!tenant?.id,
  });
}

/**
 * Hook para obtener los roles disponibles
 */
export function useAvailableRolesQuery() {
  const { tenant } = useTenant();

  if (!tenant || !tenant.id) {
    throw new Error("Error al obtener el Id del tenant");
  }

  return useQuery({
    queryKey: getAvailableRolesQueryKey(tenant.id),
    queryFn: async () => {
      const result = await getAvailableRolesAction(tenant.id);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.roles;
    },
    enabled: !!tenant?.id,
  });
}

/**
 * Hook para crear un usuario
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const result = await createUserAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.user;
    },
    onSuccess: async () => {
      showToast({
        title: "Operación Exitosa",
        description: "Usuario creado exitosamente",
        type: "success",
      });
      if (tenant?.id) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getUsersQueryKey(tenant.id),
          }),
          queryClient.invalidateQueries({
            queryKey: usersQueryKeys.paginated(tenant.id),
          }),
        ]);
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Ocurrió un Error",
        description:
          error.message ||
          "No se pudo crear el usuario. Revisá los datos e intentá de nuevo.",
        type: "error",
      });
    },
  });
}

/**
 * Hook para actualizar un usuario
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateUserData;
    }) => {
      const result = await updateUserAction(userId, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.user;
    },
    onSuccess: async () => {
      showToast({
        title: "Operación Exitosa",
        description: "Usuario actualizado exitosamente",
        type: "success",
      });
      if (tenant?.id) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getUsersQueryKey(tenant.id),
          }),
          queryClient.invalidateQueries({
            queryKey: usersQueryKeys.paginated(tenant.id),
          }),
        ]);
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Ocurrió un Error",
        description: "Error al actualizar usuario",
        type: "error",
      });
    },
  });
}

/**
 * Hook para eliminar un usuario del tenant
 */
export function useDeleteUserFromTenant() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteUserFromTenantAction(userId);
      if (!result.success) {
        throw new Error(result.error || "Error al eliminar usuario");
      }
      return result;
    },
    onSuccess: async () => {
      showToast({
        title: "Operación Exitosa",
        description: "Usuario eliminado exitosamente",
        type: "success",
      });
      if (tenant?.id) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getUsersQueryKey(tenant.id),
          }),
          queryClient.invalidateQueries({
            queryKey: usersQueryKeys.paginated(tenant.id),
          }),
        ]);
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Ocurrió un Error",
        description: "Error al eliminar usuario",
        type: "error",
      });
    },
  });
}

/**
 * Hook para actualizar los roles de un usuario
 */
export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({
      userId,
      roleIds,
    }: {
      userId: string;
      roleIds: string[];
    }) => {
      const result = await updateUserRolesAction(userId, roleIds);
      if (!result.success) {
        throw new Error(result.error || "Error al actualizar roles");
      }
      return result;
    },
    onSuccess: async () => {
      showToast({
        title: "Operación Exitosa",
        description: "Roles actualizados exitosamente",
        type: "success",
      });
      if (tenant?.id) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getUsersQueryKey(tenant.id),
          }),
          queryClient.invalidateQueries({
            queryKey: usersQueryKeys.paginated(tenant.id),
          }),
        ]);
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Ocurrió un Error",
        description: "Error al actualizar roles",
        type: "error",
      });
    },
  });
}

/**
 * Hook para activar/desactivar un usuario
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => {
      const result = await toggleUserActiveAction({ userId, isActive });
      if (!result.success) {
        throw new Error(result.error || "Error al cambiar estado");
      }
      return result;
    },
    onSuccess: async (_, variables) => {
      const action = variables.isActive ? "activado" : "desactivado";
      showToast({
        title: "Usuario actualizado",
        description: `El usuario fue ${action} correctamente`,
        type: "success",
      });
      if (tenant?.id) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getUsersQueryKey(tenant.id),
          }),
          queryClient.invalidateQueries({
            queryKey: usersQueryKeys.paginated(tenant.id),
          }),
        ]);
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Error",
        description: error.message || "Error al cambiar el estado del usuario",
        type: "error",
      });
    },
  });
}
