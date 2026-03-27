"use client";

import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { invoiceQueryKeys } from "@core/shared/constants/query-keys";
import { getAvailableAnticiposAction } from "../../server/presentation/actions/getAvailableAnticipos.action";
import type { InvoiceDTO } from "../types/invoice.types";

/**
 * Hook para obtener anticipos disponibles (no consumidos) para un cliente.
 * Usado por el selector de anticipos en el formulario de LIQUIDACI\u00d3N.
 */
export function useAvailableAnticipos(clientId: string | undefined) {
  const { tenant } = useTenant();

  return useQuery<InvoiceDTO[]>({
    queryKey: tenant?.id && clientId
      ? invoiceQueryKeys.availableAnticipos(tenant.id, clientId)
      : ["invoices", "available-anticipos", "no-tenant"],
    queryFn: async (): Promise<InvoiceDTO[]> => {
      if (!clientId) return [];
      const result = await getAvailableAnticiposAction(clientId);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: !!tenant?.id && !!clientId,
    staleTime: 30_000,
  });
}
