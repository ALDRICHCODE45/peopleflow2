"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getTenantUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserFromTenantAction,
  updateUserRolesAction,
  getAvailableRolesAction,
} from "../../server/presentation/actions/user.actions";
import type { TenantUser, CreateUserData, UpdateUserData } from "../types";
import { getCurrentTenantId } from "@/core/lib/tenant-context";
import { TenantProvider, useTenant } from "@/features/tenants/frontend/context/TenantContext";

// Query Keys
export const USERS_QUERY_KEY = ["tenant-users"] as const;
export const AVAILABLE_ROLES_QUERY_KEY = ["available-roles"] as const;

/**
 * Hook para obtener los usuarios del tenant actual
 */
export function useTenantUsersQuery() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async (): Promise<TenantUser[]> => {
      const result = await getTenantUsersAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.users;
    },
  });
}

/**
 * Hook para obtener los roles disponibles
 */
export function useAvailableRolesQuery() {
  const {tenant} = useTenant()
  if(!tenant || !tenant.id){
    throw new Error('Error al obtener el Id del tenant')
  }

  return useQuery({
    queryKey: AVAILABLE_ROLES_QUERY_KEY,
    queryFn: async () => {
      const result = await getAvailableRolesAction(tenant.id);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.roles;
    },
  });
}

/**
 * Hook para crear un usuario
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const result = await createUserAction(data);
      if (result.error) {
        console.log(result)
        throw new Error(result.error);
      }
      return result.user;
    },
    onSuccess: async () => {
      toast.success("Usuario creado exitosamente");
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear usuario");
      console.log(error)
    },
  });
}

/**
 * Hook para actualizar un usuario
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

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
      toast.success("Usuario actualizado exitosamente");
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar usuario");
    },
  });
}

/**
 * Hook para eliminar un usuario del tenant
 */
export function useDeleteUserFromTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteUserFromTenantAction(userId);
      if (!result.success) {
        throw new Error(result.error || "Error al eliminar usuario");
      }
      return result;
    },
    onSuccess: async () => {
      toast.success("Usuario eliminado del tenant exitosamente");
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar usuario");
    },
  });
}

/**
 * Hook para actualizar los roles de un usuario
 */
export function useUpdateUserRoles() {
  const queryClient = useQueryClient();

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
      toast.success("Roles actualizados exitosamente");
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar roles");
    },
  });
}
