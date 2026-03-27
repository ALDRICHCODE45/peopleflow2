"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { invoiceQueryKeys } from "@core/shared/constants/query-keys";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import {
  getInvoiceVacancyOptionsAction,
  type InvoiceVacancyOption,
} from "../../server/presentation/actions/getInvoiceVacancyOptions.action";

export function useInvoiceVacancyOptions(clientId?: string) {
  const { tenant } = useTenant();

  return useQuery<InvoiceVacancyOption[]>({
    queryKey: tenant?.id
      ? invoiceQueryKeys.vacancyOptions(tenant.id, clientId)
      : ["invoices", "vacancy-options", "no-tenant", clientId ?? "all"],
    queryFn: async () => {
      const result = await getInvoiceVacancyOptionsAction(clientId);
      if (result.error) {
        throw new Error(result.error);
      }

      return result.vacancies;
    },
    enabled: !!tenant?.id,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
