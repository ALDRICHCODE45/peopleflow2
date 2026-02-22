import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationConfigAction,
  saveNotificationConfigAction,
} from "../../server/presentation/actions/notificationConfig.actions";
import type { SaveNotificationConfigData } from "../types";
import { showToast } from "@/core/shared/components/ShowToast";

const QUERY_KEY = ["notification-config"];

export function useNotificationConfigQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await getNotificationConfigAction();
      if (result.error) throw new Error(result.error);
      return result.config ?? null;
    },
  });
}

export function useSaveNotificationConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SaveNotificationConfigData) => {
      const result = await saveNotificationConfigAction(data);
      if (result.error) throw new Error(result.error);
      return result.config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      showToast({
        type: "success",
        title: "Configuración guardada",
        description: "Los cambios se aplicarán a las próximas notificaciones",
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Error al guardar",
        description: error.message,
      });
    },
  });
}
