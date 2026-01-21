"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { TenantUser } from "../types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getPaginatedUsersAction } from "../../server/presentation/actions/getPaginatedUsersAction.action";
import type {
  PaginatedResponse,
  SortingParam,
} from "@/core/shared/types/pagination.types";

/** Parámetros para la query paginada de usuarios */
export interface PaginatedUsersQueryParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
}

/** Query Key Factory - CRÍTICO: incluir TODOS los parámetros */
export const getPaginatedUsersQueryKey = (
  tenantId: string,
  params: PaginatedUsersQueryParams
) =>
  [
    "users",
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
 * Hook para obtener usuarios con paginación server-side
 * Optimizado para TanStack Table con manualPagination
 *
 * @example
 * const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
 * const [sorting, setSorting] = useState<SortingState>([]);
 * const debouncedSearch = useDebouncedValue(search, 300);
 *
 * const { data, isLoading, isFetching } = usePaginatedUsersQuery({
 *   pageIndex: pagination.pageIndex,
 *   pageSize: pagination.pageSize,
 *   sorting,
 *   globalFilter: debouncedSearch,
 * });
 */
export function usePaginatedUsersQuery(params: PaginatedUsersQueryParams) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getPaginatedUsersQueryKey(tenant.id, params)
      : ["users", "paginated", "no-tenant"],
    queryFn: async (): Promise<PaginatedResponse<TenantUser>> => {
      const result = await getPaginatedUsersAction({
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
