"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getPlacementsReportAction } from "../../server/presentation/actions/getPlacementsReport.action";
import type { PlacementsReportDTO } from "../types/vacancy.types";

export interface PlacementsReportQueryParams {
  from: string;
  to: string;
}

export function usePlacementsReportQuery(
  params: PlacementsReportQueryParams
): UseQueryResult<PlacementsReportDTO, Error> {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["placements-report", tenant?.id, params.from, params.to],
    queryFn: async (): Promise<PlacementsReportDTO> => {
      const result = await getPlacementsReportAction({
        from: params.from,
        to: params.to,
      });
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!tenant?.id && !!params.from && !!params.to,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
