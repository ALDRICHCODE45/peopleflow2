"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { clientsQueryKeys } from "@core/shared/constants/query-keys";
import {
  getClientByIdAction,
  updateClientAction,
  getClientsListAction,
} from "../../server/presentation/actions/client.actions";
import { updateClientFiscalDataAction } from "../../server/presentation/actions/updateClientFiscalData.action";
import type { UpdateClientData, FiscalData } from "../../server/domain/interfaces/IClientRepository";
import type { ClientDTO } from "../types/client.types";

// --- Queries ---

/**
 * Hook para obtener un cliente por ID
 */
export function useClientById(clientId: string | undefined) {
  const { tenant } = useTenant();

  return useQuery<ClientDTO | undefined>({
    queryKey: clientsQueryKeys.detail(tenant?.id ?? "", clientId ?? ""),
    queryFn: async () => {
      if (!clientId) return undefined;
      const result = await getClientByIdAction(clientId);
      if (result.error) throw new Error(result.error);
      return result.client;
    },
    enabled: !!tenant?.id && !!clientId,
    staleTime: 30_000,
  });
}

/**
 * Hook para listar todos los clientes del tenant
 */
export function useClientsListQuery() {
  const { tenant } = useTenant();

  return useQuery<ClientDTO[]>({
    queryKey: [...clientsQueryKeys.paginated(tenant?.id ?? ""), "all"],
    queryFn: async () => {
      const result = await getClientsListAction();
      if (result.error) throw new Error(result.error);
      return result.clients;
    },
    enabled: !!tenant?.id,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// --- Mutations ---

/**
 * Hook para actualizar un cliente (condiciones comerciales, nombre, etc.)
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({
      clientId,
      data,
    }: {
      clientId: string;
      data: UpdateClientData;
    }) => {
      const result = await updateClientAction(clientId, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Cliente actualizado",
        description: "Las condiciones comerciales se actualizaron correctamente",
      });

      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: clientsQueryKeys.paginated(tenant.id),
        });
        queryClient.invalidateQueries({
          queryKey: clientsQueryKeys.detail(tenant.id, variables.clientId),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al actualizar el cliente",
      });
    },
  });
}

/**
 * Hook para actualizar los datos fiscales de un cliente
 */
export function useUpdateClientFiscalData() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({
      clientId,
      fiscalData,
    }: {
      clientId: string;
      fiscalData: FiscalData;
    }) => {
      const result = await updateClientFiscalDataAction(clientId, fiscalData);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Datos fiscales actualizados",
        description: "Los datos fiscales se actualizaron correctamente",
      });

      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: clientsQueryKeys.paginated(tenant.id),
        });
        queryClient.invalidateQueries({
          queryKey: clientsQueryKeys.detail(tenant.id, variables.clientId),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al actualizar datos fiscales",
      });
    },
  });
}
