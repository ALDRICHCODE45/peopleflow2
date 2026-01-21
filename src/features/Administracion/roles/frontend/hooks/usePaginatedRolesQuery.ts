"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { RoleWithStats } from "../types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getPaginatedRolesAction } from "../../server/presentation/actions/getPaginatedRolesAction.action";
import type {
  PaginatedResponse,
  SortingParam,
} from "@/core/shared/types/pagination.types";

/** Parámetros para la query paginada de roles */
export interface PaginatedRolesQueryParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
}

/** Query Key Factory - CRÍTICO: incluir TODOS los parámetros */
export const getPaginatedRolesQueryKey = (
  tenantId: string,
  params: PaginatedRolesQueryParams
) =>
  [
    "roles",
    "paginated",
    tenantId,
    {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sorting: params.sorting,
      globalFilter: params.globalFilter,
    },
  ] as const;

/**
 * Hook para obtener roles con paginación server-side
 * Optimizado para TanStack Table con manualPagination
 *
 * @example
 * const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
 * const [sorting, setSorting] = useState<SortingState>([]);
 * const debouncedSearch = useDebouncedValue(search, 300);
 *
 * const { data, isLoading, isFetching } = usePaginatedRolesQuery({
 *   pageIndex: pagination.pageIndex,
 *   pageSize: pagination.pageSize,
 *   sorting,
 *   globalFilter: debouncedSearch,
 * });
 */
export function usePaginatedRolesQuery(params: PaginatedRolesQueryParams) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getPaginatedRolesQueryKey(tenant.id, params)
      : ["roles", "paginated", "no-tenant"],
    queryFn: async (): Promise<PaginatedResponse<RoleWithStats>> => {
      const result = await getPaginatedRolesAction({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        sorting: params.sorting,
        globalFilter: params.globalFilter,
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
