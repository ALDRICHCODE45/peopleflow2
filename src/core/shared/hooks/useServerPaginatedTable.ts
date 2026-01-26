"use client";

import { useState, useCallback, useMemo } from "react";
import { PaginationState, SortingState, Updater } from "@tanstack/react-table";
import { useDebouncedValue } from "./useDebouncedValue";

export interface UseServerPaginatedTableOptions<TStatus = string> {
  /** Initial page size (default: 10) */
  initialPageSize?: number;
  /** Debounce delay for search in ms (default: 300) */
  debounceDelay?: number;
  /** Initial tab ID (default: "all") */
  initialTab?: string;
  /** Function to extract status from tab ID (default: returns tab if not "all") */
  tabToStatus?: (tabId: string) => TStatus | undefined;
}

export interface UseServerPaginatedTableReturn<TStatus = string> {
  // State
  pagination: PaginationState;
  sorting: SortingState;
  globalFilter: string;
  activeTab: string;
  debouncedSearch: string;
  statusFilter: TStatus | undefined;

  // Setters (with smart reset logic)
  setPagination: (updater: Updater<PaginationState>) => void;
  setSorting: (updater: Updater<SortingState>) => void;
  handleGlobalFilterChange: (value: string) => void;
  handleTabChange: (tabId: string) => void;

  /**
   * Smart pageSize change handler that calculates a valid pageIndex
   * when changing page size to avoid showing empty pages.
   *
   * @param newPageSize - The new page size
   * @param totalCount - Total number of items (from server response)
   */
  handlePageSizeChange: (newPageSize: number, totalCount: number) => void;

  /**
   * Creates a pagination change handler that wraps setPagination
   * with smart pageSize handling.
   *
   * @param totalCount - Total number of items (from server response)
   */
  createPaginationHandler: (
    totalCount: number
  ) => (updater: Updater<PaginationState>) => void;
}

/**
 * Hook for server-side paginated tables.
 *
 * Encapsulates:
 * - Pagination, sorting, globalFilter, and tab state
 * - Debounced search (300ms by default)
 * - Smart page reset on filter/sort/tab changes
 * - Smart pageSize change that keeps user on a valid page
 *
 * @example
 * ```tsx
 * const {
 *   pagination, sorting, debouncedSearch, statusFilter, activeTab,
 *   setPagination, setSorting, handleGlobalFilterChange, handleTabChange,
 *   createPaginationHandler,
 * } = useServerPaginatedTable<LeadStatus>({ initialPageSize: 10 });
 *
 * // Pass createPaginationHandler to DataTable
 * <DataTable
 *   onPaginationChange={createPaginationHandler(paginationMeta?.totalCount ?? 0)}
 *   onSortingChange={setSorting}
 *   onGlobalFilterChange={handleGlobalFilterChange}
 * />
 * ```
 */
export function useServerPaginatedTable<TStatus = string>(
  options: UseServerPaginatedTableOptions<TStatus> = {}
): UseServerPaginatedTableReturn<TStatus> {
  const {
    initialPageSize = 10,
    debounceDelay = 300,
    initialTab = "all",
    tabToStatus = (tabId: string) =>
      tabId !== "all" ? (tabId as unknown as TStatus) : undefined,
  } = options;

  // Core state
  const [pagination, setPaginationInternal] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [sorting, setSortingInternal] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Debounced search value
  const debouncedSearch = useDebouncedValue(globalFilter, debounceDelay);

  // Derive status filter from active tab
  const statusFilter = useMemo(
    () => tabToStatus(activeTab),
    [activeTab, tabToStatus]
  );

  // Handler for direct pagination changes (page navigation)
  const setPagination = useCallback(
    (updater: Updater<PaginationState>) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;
      setPaginationInternal(newPagination);
    },
    [pagination]
  );

  // Handler for sorting changes - resets to page 0
  const setSorting = useCallback(
    (updater: Updater<SortingState>) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      setSortingInternal(newSorting);
      setPaginationInternal((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [sorting]
  );

  // Handler for global filter changes - resets to page 0
  const handleGlobalFilterChange = useCallback((value: string) => {
    setGlobalFilter(value);
    setPaginationInternal((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Handler for tab changes - resets to page 0
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setPaginationInternal((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  /**
   * Smart pageSize change that calculates the best pageIndex
   * to keep the user viewing similar data.
   *
   * Example:
   * - 15 items total, currently on page 1 (items 6-10), pageSize 5
   * - User changes to pageSize 10
   * - Without smart handling: stays on page 1, shows items 11-15 (different data)
   * - With smart handling: goes to page 0, shows items 1-10 (includes current first item)
   */
  const handlePageSizeChange = useCallback(
    (newPageSize: number, totalCount: number) => {
      const currentFirstItemIndex = pagination.pageIndex * pagination.pageSize;
      const newPageIndex = Math.floor(currentFirstItemIndex / newPageSize);
      const maxPageIndex = Math.max(
        0,
        Math.ceil(totalCount / newPageSize) - 1
      );

      setPaginationInternal({
        pageSize: newPageSize,
        pageIndex: Math.min(newPageIndex, maxPageIndex),
      });
    },
    [pagination.pageIndex, pagination.pageSize]
  );

  /**
   * Creates a pagination handler that intercepts pageSize changes
   * and applies smart logic to calculate valid pageIndex.
   */
  const createPaginationHandler = useCallback(
    (totalCount: number) => {
      return (updater: Updater<PaginationState>) => {
        const newPagination =
          typeof updater === "function" ? updater(pagination) : updater;

        // Detect pageSize change
        if (newPagination.pageSize !== pagination.pageSize) {
          handlePageSizeChange(newPagination.pageSize, totalCount);
        } else {
          // Normal page navigation
          setPaginationInternal(newPagination);
        }
      };
    },
    [pagination, handlePageSizeChange]
  );

  return {
    // State
    pagination,
    sorting,
    globalFilter,
    activeTab,
    debouncedSearch,
    statusFilter,

    // Handlers
    setPagination,
    setSorting,
    handleGlobalFilterChange,
    handleTabChange,
    handlePageSizeChange,
    createPaginationHandler,
  };
}
