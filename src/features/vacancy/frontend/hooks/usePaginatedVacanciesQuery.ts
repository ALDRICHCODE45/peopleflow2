"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  VacancyStatusType,
  VacancySaleType,
  VacancyModality,
  VacancyServiceType,
  VacancyCurrency,
  VacancySalaryType,
  VacancyDTO,
} from "../types/vacancy.types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getPaginatedVacanciesAction } from "../../server/presentation/actions/getPaginatedVacanciesAction.action";
import type {
  PaginatedResponse,
  SortingParam,
} from "@/core/shared/types/pagination.types";

/** Parámetros para la query paginada de vacantes */
export interface PaginatedVacanciesQueryParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
  statuses?: VacancyStatusType[];
  saleTypes?: VacancySaleType[];
  serviceTypes?: VacancyServiceType[];
  modalities?: VacancyModality[];
  currencies?: VacancyCurrency[];
  salaryTypes?: VacancySalaryType[];
  recruiterIds?: string[];
  clientIds?: string[];
  countryCodes?: string[];
  regionCodes?: string[];
  requiresPsychometry?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  assignedAtFrom?: string;
  assignedAtTo?: string;
  targetDeliveryDateFrom?: string;
  targetDeliveryDateTo?: string;
  deliveryUrgency?: "OVERDUE" | "DUE_3_DAYS" | "DUE_7_DAYS" | "DUE_14_DAYS";
}

/** Query Key Factory - CRÍTICO: incluir TODOS los parámetros */
export const getPaginatedVacanciesQueryKey = (
  tenantId: string,
  params: PaginatedVacanciesQueryParams
) =>
  [
    "vacancies",
    "paginated",
    tenantId,
    {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sorting: params.sorting,
      globalFilter: params.globalFilter,
      statuses: params.statuses,
      saleTypes: params.saleTypes,
      serviceTypes: params.serviceTypes,
      modalities: params.modalities,
      currencies: params.currencies,
      salaryTypes: params.salaryTypes,
      recruiterIds: params.recruiterIds,
      clientIds: params.clientIds,
      countryCodes: params.countryCodes,
      regionCodes: params.regionCodes,
      requiresPsychometry: params.requiresPsychometry,
      salaryMin: params.salaryMin,
      salaryMax: params.salaryMax,
      assignedAtFrom: params.assignedAtFrom,
      assignedAtTo: params.assignedAtTo,
      targetDeliveryDateFrom: params.targetDeliveryDateFrom,
      targetDeliveryDateTo: params.targetDeliveryDateTo,
      deliveryUrgency: params.deliveryUrgency,
    },
  ] as const;

/**
 * Hook para obtener vacantes con paginación server-side
 * Optimizado para TanStack Table con manualPagination
 *
 * @example
 * const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
 * const [sorting, setSorting] = useState<SortingState>([]);
 * const debouncedSearch = useDebouncedValue(search, 300);
 *
 * const { data, isLoading, isFetching } = usePaginatedVacanciesQuery({
 *   pageIndex: pagination.pageIndex,
 *   pageSize: pagination.pageSize,
 *   sorting,
 *   globalFilter: debouncedSearch,
 *   status: activeTab !== "all" ? activeTab : undefined,
 * });
 */
export function usePaginatedVacanciesQuery(
  params: PaginatedVacanciesQueryParams
): UseQueryResult<PaginatedResponse<VacancyDTO>, Error> {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getPaginatedVacanciesQueryKey(tenant.id, params)
      : ["vacancies", "paginated", "no-tenant"],
    queryFn: async (): Promise<PaginatedResponse<VacancyDTO>> => {
      const result = await getPaginatedVacanciesAction({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        sorting: params.sorting,
        globalFilter: params.globalFilter,
        statuses: params.statuses,
        saleTypes: params.saleTypes,
        serviceTypes: params.serviceTypes,
        modalities: params.modalities,
        currencies: params.currencies,
        salaryTypes: params.salaryTypes,
        recruiterIds: params.recruiterIds,
        clientIds: params.clientIds,
        countryCodes: params.countryCodes,
        regionCodes: params.regionCodes,
        requiresPsychometry: params.requiresPsychometry,
        salaryMin: params.salaryMin,
        salaryMax: params.salaryMax,
        assignedAtFrom: params.assignedAtFrom,
        assignedAtTo: params.assignedAtTo,
        targetDeliveryDateFrom: params.targetDeliveryDateFrom,
        targetDeliveryDateTo: params.targetDeliveryDateTo,
        deliveryUrgency: params.deliveryUrgency,
      });

      if ("error" in result && result.error) {
        throw new Error(result.error);
      }

      return {
        data: result.data ?? [],
        pagination: result.pagination ?? {
          pageIndex: params.pageIndex,
          pageSize: params.pageSize,
          totalCount: 0,
          pageCount: 0,
        },
      };
    },
    enabled: !!tenant?.id,
    // CRÍTICO: Mantiene datos anteriores mientras carga nuevos (evita flash)
    placeholderData: keepPreviousData,
    // Refetch en foco deshabilitado para tablas (mejor UX)
    refetchOnWindowFocus: false,
    // Stale time para evitar refetch innecesarios
    staleTime: 30 * 1000, // 30 segundos
  });
}
