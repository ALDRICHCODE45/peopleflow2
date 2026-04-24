"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { usePaginatedVacanciesQuery } from "../hooks/usePaginatedVacanciesQuery";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { createVacancyColumns } from "../components/columns/VacancyColumns";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { VacanciesTableConfig } from "../components/tableConfig/VacanciesTableConfig";
import { DataTableMultiTabs } from "@/core/shared/components/DataTable/DataTableMultiTabs";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { Button } from "@/core/shared/ui/shadcn/button";
import { VacancySheetForm } from "../components/VacancySheetForm";
import { VacancyDetailSheet } from "../components/VacancyDetailSheet";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import type { VacancyStatusType } from "../types/vacancy.types";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { enrichVacancyTabsWithCounts } from "../config/vacancyTabsConfig";
import { useVacanciesFilters } from "../components/tableConfig/hooks/useVacanciesFilters";
import type {
  VacancyDTO,
  VacancySaleType,
  VacancyServiceType,
  VacancyModality,
  VacancyCurrency,
  VacancySalaryType,
} from "../types/vacancy.types";
import { useAuth } from "@/core/shared/hooks/use-auth";
import type { DeliveryUrgencyFilter } from "../components/tableConfig/hooks/useVacanciesFilters";
import { BulkDeleteVacanciesDialog } from "../components/BulkDeleteVacanciesDialog";
import { BulkReassignVacanciesDialog } from "../components/BulkReassignVacanciesDialog";
import { BulkDuplicateVacanciesDialog } from "../components/BulkDuplicateVacanciesDialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { ExpanderIcon, Minimize01Icon } from "@hugeicons/core-free-icons";

type VacancyQuickPreset = "MY_VACANCIES" | "URGENT" | "THIS_WEEK";

const toDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function VacancyListPage() {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const currentUserLabel = user?.name ?? user?.email ?? "";
  const { hasAnyPermission, isSuperAdmin } = usePermissions();
  const canCreateVacancy =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.crear,
      PermissionActions.vacantes.gestionar,
    ]);

  const { isOpen, openModal, closeModal } = useModalState();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawVacancyId = searchParams.get("vacancyId");
  const sanitizedVacancyId =
    rawVacancyId && !/^(\[.+\]|<.+>)$/.test(rawVacancyId)
      ? rawVacancyId
      : null;
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(
    sanitizedVacancyId,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedVacancyId((current) =>
      current === sanitizedVacancyId ? current : sanitizedVacancyId,
    );
  }, [sanitizedVacancyId]);
  const [selectionResetSignal, setSelectionResetSignal] = useState(0);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkReassignOpen, setBulkReassignOpen] = useState(false);
  const [bulkDuplicateOpen, setBulkDuplicateOpen] = useState(false);
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  const [selectedBulkVacancies, setSelectedBulkVacancies] = useState<
    VacancyDTO[]
  >([]);

  // Focus mode — estado controlado en la página
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Server-side pagination state with multi-tab support
  const {
    pagination,
    sorting,
    activeTabs,
    debouncedSearch,
    statusFilters,
    setSorting,
    handleGlobalFilterChange,
    handleMultiTabChange,
    createPaginationHandler,
    setPagination,
    globalFilter,
  } = useServerPaginatedTable<VacancyStatusType>({ initialPageSize: 10 });

  // Advanced filters state
  const {
    filters,
    hasActiveFilters,
    activeSheetFiltersCount,
    setSaleTypes,
    setServiceTypes,
    setModalities,
    setCurrencies,
    setSalaryTypes,
    setRecruiterIds,
    setClientIds,
    setCountryCodes,
    setRegionCodes,
    setRequiresPsychometry,
    setSalaryMin,
    setSalaryMax,
    setAssignedAtFrom,
    setAssignedAtTo,
    setTargetDeliveryDateFrom,
    setTargetDeliveryDateTo,
    setDeliveryUrgency,
    clearFilters: clearAdvancedFilters,
  } = useVacanciesFilters();

  const [activePreset, setActivePreset] = useState<VacancyQuickPreset | null>(
    null,
  );

  // Tabs are the single source of truth for status filtering
  const effectiveStatuses = useMemo(() => {
    return statusFilters.length > 0 ? statusFilters : undefined;
  }, [statusFilters]);

  // Query with server-side pagination and all filters
  const { data, isFetching, isPending } = usePaginatedVacanciesQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
    statuses: effectiveStatuses,
    saleTypes: filters.saleTypes.length > 0 ? filters.saleTypes : undefined,
    serviceTypes:
      filters.serviceTypes.length > 0 ? filters.serviceTypes : undefined,
    modalities: filters.modalities.length > 0 ? filters.modalities : undefined,
    currencies: filters.currencies.length > 0 ? filters.currencies : undefined,
    salaryTypes:
      filters.salaryTypes.length > 0 ? filters.salaryTypes : undefined,
    recruiterIds:
      filters.recruiterIds.length > 0 ? filters.recruiterIds : undefined,
    clientIds: filters.clientIds.length > 0 ? filters.clientIds : undefined,
    countryCodes:
      filters.countryCodes.length > 0 ? filters.countryCodes : undefined,
    regionCodes:
      filters.regionCodes.length > 0 ? filters.regionCodes : undefined,
    requiresPsychometry: filters.requiresPsychometry,
    salaryMin: filters.salaryMin,
    salaryMax: filters.salaryMax,
    assignedAtFrom: filters.assignedAtFrom || undefined,
    assignedAtTo: filters.assignedAtTo || undefined,
    targetDeliveryDateFrom: filters.targetDeliveryDateFrom || undefined,
    targetDeliveryDateTo: filters.targetDeliveryDateTo || undefined,
    deliveryUrgency: filters.deliveryUrgency,
    vacancyId: selectedVacancyId || undefined,
  });

  // Extract data from paginated response
  const vacancies = data?.data ?? [];
  const paginationMeta = data?.pagination;
  const totalCount = paginationMeta?.totalCount ?? 0;

  // Solo mostrar skeleton si es carga inicial SIN datos previos
  const showInitialLoading = isPending && !data;

  // Tabs config with dynamic counts
  const tabsConfig = useMemo(
    () => enrichVacancyTabsWithCounts(activeTabs, totalCount),
    [activeTabs, totalCount],
  );

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  const handleClearFilters = useCallback(() => {
    setActivePreset(null);
    handleGlobalFilterChange("");
    handleMultiTabChange([]);
    clearAdvancedFilters();
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [
    handleGlobalFilterChange,
    handleMultiTabChange,
    clearAdvancedFilters,
    setPagination,
  ]);

  const handlePresetChange = useCallback(
    (preset: VacancyQuickPreset) => {
      if (activePreset === preset) {
        if (preset === "MY_VACANCIES") setRecruiterIds([]);
        if (preset === "URGENT") setDeliveryUrgency(undefined);
        if (preset === "THIS_WEEK") {
          setAssignedAtFrom("");
          setAssignedAtTo("");
        }
        setActivePreset(null);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        return;
      }

      setActivePreset(preset);

      if (preset === "MY_VACANCIES") {
        setRecruiterIds(currentUserId ? [currentUserId] : []);
      }

      if (preset === "URGENT") {
        setDeliveryUrgency("DUE_7_DAYS");
      }

      if (preset === "THIS_WEEK") {
        const now = new Date();
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        setAssignedAtFrom(toDateInput(monday));
        setAssignedAtTo(toDateInput(sunday));
      }

      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [
      activePreset,
      setRecruiterIds,
      setDeliveryUrgency,
      setAssignedAtFrom,
      setAssignedAtTo,
      currentUserId,
      setPagination,
    ],
  );

  const handleRemoveStatusChip = useCallback(
    (status: VacancyStatusType) => {
      handleMultiTabChange(statusFilters.filter((s) => s !== status));
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [handleMultiTabChange, statusFilters, setPagination],
  );

  const handleViewDetail = useCallback(
    (id: string) => {
      setSelectedVacancyId(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("vacancyId", id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedVacancyId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("vacancyId");
    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleBulkDelete = useCallback((rows: VacancyDTO[]) => {
    setSelectedBulkIds(rows.map((vacancy) => vacancy.id));
    setBulkDeleteOpen(true);
  }, []);

  const handleBulkReassign = useCallback((rows: VacancyDTO[]) => {
    setSelectedBulkIds(rows.map((vacancy) => vacancy.id));
    setSelectedBulkVacancies(rows);
    setBulkReassignOpen(true);
  }, []);

  const handleBulkDuplicate = useCallback((ids: string[]) => {
    setSelectedBulkIds(ids);
    setBulkDuplicateOpen(true);
  }, []);

  const handleBulkCompleted = useCallback(() => {
    setBulkDeleteOpen(false);
    setBulkReassignOpen(false);
    setBulkDuplicateOpen(false);
    setSelectedBulkIds([]);
    setSelectedBulkVacancies([]);
    setSelectionResetSignal((current) => current + 1);
  }, []);

  // Columns factory with detail handler
  const columns = useMemo(
    () => createVacancyColumns(handleViewDetail),
    [handleViewDetail],
  );

  // Table configuration with server-side enabled
  const tableConfig = useMemo(
    () =>
      createTableConfig(VacanciesTableConfig, {
        onAdd: canCreateVacancy ? handleAdd : undefined,
        onClearFilters: handleClearFilters,
        // Inline filters
        globalFilter: globalFilter ?? "",
        selectedRecruiterIds: filters.recruiterIds,
        onRecruiterIdsChange: (ids: string[]) => {
          setActivePreset(null);
          setRecruiterIds(ids);
        },
        currentUserId: currentUserId ?? "",
        currentUserLabel,
        activePreset,
        onPresetChange: handlePresetChange,
        selectedTabStatuses: statusFilters,
        onRemoveTabStatus: handleRemoveStatusChip,
        // Sheet filters
        selectedSaleTypes: filters.saleTypes,
        onSaleTypesChange: (values: VacancySaleType[]) => {
          setActivePreset(null);
          setSaleTypes(values);
        },
        selectedServiceTypes: filters.serviceTypes,
        onServiceTypesChange: (values: VacancyServiceType[]) => {
          setActivePreset(null);
          setServiceTypes(values);
        },
        selectedModalities: filters.modalities,
        onModalitiesChange: (values: VacancyModality[]) => {
          setActivePreset(null);
          setModalities(values);
        },
        selectedCurrencies: filters.currencies,
        onCurrenciesChange: (values: VacancyCurrency[]) => {
          setActivePreset(null);
          setCurrencies(values);
        },
        selectedSalaryTypes: filters.salaryTypes,
        onSalaryTypesChange: (values: VacancySalaryType[]) => {
          setActivePreset(null);
          setSalaryTypes(values);
        },
        selectedClientIds: filters.clientIds,
        onClientIdsChange: (ids: string[]) => {
          setActivePreset(null);
          setClientIds(ids);
        },
        selectedCountryCodes: filters.countryCodes,
        onCountryCodesChange: (codes: string[]) => {
          setActivePreset(null);
          setCountryCodes(codes);
        },
        selectedRegionCodes: filters.regionCodes,
        onRegionCodesChange: (codes: string[]) => {
          setActivePreset(null);
          setRegionCodes(codes);
        },
        requiresPsychometry: filters.requiresPsychometry,
        onRequiresPsychometryChange: (value: boolean | undefined) => {
          setActivePreset(null);
          setRequiresPsychometry(value);
        },
        salaryMin: filters.salaryMin,
        onSalaryMinChange: (value: number | undefined) => {
          setActivePreset(null);
          setSalaryMin(value);
        },
        salaryMax: filters.salaryMax,
        onSalaryMaxChange: (value: number | undefined) => {
          setActivePreset(null);
          setSalaryMax(value);
        },
        assignedAtFrom: filters.assignedAtFrom,
        onAssignedAtFromChange: (date: string) => {
          setActivePreset(null);
          setAssignedAtFrom(date);
        },
        assignedAtTo: filters.assignedAtTo,
        onAssignedAtToChange: (date: string) => {
          setActivePreset(null);
          setAssignedAtTo(date);
        },
        targetDeliveryDateFrom: filters.targetDeliveryDateFrom,
        onTargetDeliveryDateFromChange: (date: string) => {
          setActivePreset(null);
          setTargetDeliveryDateFrom(date);
        },
        targetDeliveryDateTo: filters.targetDeliveryDateTo,
        onTargetDeliveryDateToChange: (date: string) => {
          setActivePreset(null);
          setTargetDeliveryDateTo(date);
        },
        deliveryUrgency: filters.deliveryUrgency,
        onDeliveryUrgencyChange: (value: DeliveryUrgencyFilter | undefined) => {
          setActivePreset(null);
          setDeliveryUrgency(value);
        },
        hasActiveSheetFilters: hasActiveFilters,
        activeSheetFiltersCount,
        onBulkDelete: handleBulkDelete,
        onBulkReasign: handleBulkReassign,
        onBulkDuplicate: handleBulkDuplicate,
        serverSide: {
          enabled: true,
          totalCount,
          pageCount: paginationMeta?.pageCount ?? 0,
        },
        // Focus mode controlado por la página
        focusMode: {
          enabled: true,
          isFocusMode,
          onFocusModeChange: setIsFocusMode,
        },
      }),
    [
      totalCount,
      paginationMeta?.pageCount,
      canCreateVacancy,
      handleAdd,
      handleClearFilters,
      globalFilter,
      filters,
      hasActiveFilters,
      activeSheetFiltersCount,
      setSaleTypes,
      setServiceTypes,
      setModalities,
      setCurrencies,
      setSalaryTypes,
      setRecruiterIds,
      setClientIds,
      setCountryCodes,
      setRegionCodes,
      setRequiresPsychometry,
      setSalaryMin,
      setSalaryMax,
      setAssignedAtFrom,
      setAssignedAtTo,
      setTargetDeliveryDateFrom,
      setTargetDeliveryDateTo,
      setDeliveryUrgency,
      activePreset,
      currentUserId,
      currentUserLabel,
      handlePresetChange,
      statusFilters,
      handleRemoveStatusChip,
      handleBulkDelete,
      handleBulkReassign,
      handleBulkDuplicate,
      isFocusMode,
    ],
  );

  return (
    <>
      <Card className="p-2 m-1">
        <CardContent>
          <div className="space-y-6">
            {/* Header y tabs — se ocultan en modo foco */}
            {!isFocusMode && (
              <>
                <TablePresentation
                  title="Gestión de Vacantes"
                  subtitle="Administra las vacantes de tu organización"
                />

                <div className="flex items-center justify-between gap-4">
                  <DataTableMultiTabs
                    tabs={tabsConfig}
                    activeTabs={activeTabs}
                    onTabsChange={handleMultiTabChange}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFocusMode(true)}
                    className="gap-2 flex-shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Activar modo presentación"
                  >
                    <HugeiconsIcon icon={ExpanderIcon} className="h-4 w-4" />
                    <span className="hidden sm:inline">Modo presentación</span>
                  </Button>
                </div>
              </>
            )}

            {/* En modo foco: tabs + botón de salir en la misma fila */}
            {isFocusMode && (
              <div className="flex items-center justify-between gap-4">
                <DataTableMultiTabs
                  tabs={tabsConfig}
                  activeTabs={activeTabs}
                  onTabsChange={handleMultiTabChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFocusMode(false)}
                  className="gap-2 flex-shrink-0"
                  aria-label="Salir del modo presentación"
                >
                  <HugeiconsIcon icon={Minimize01Icon} className="h-4 w-4" />
                  <span>Salir de la presentación</span>
                </Button>
              </div>
            )}

            <PermissionGuard
              permissions={[
                PermissionActions.vacantes.acceder,
                PermissionActions.vacantes.gestionar,
              ]}
            >
              <DataTable
                columns={columns}
                data={vacancies}
                config={tableConfig}
                isLoading={showInitialLoading}
                isFetching={isFetching && !showInitialLoading}
                pagination={pagination}
                sorting={sorting}
                onPaginationChange={createPaginationHandler(totalCount)}
                onSortingChange={setSorting}
                onGlobalFilterChange={handleGlobalFilterChange}
                clearSelectionSignal={selectionResetSignal}
              />
            </PermissionGuard>

            <PermissionGuard
              permissions={[
                PermissionActions.vacantes.crear,
                PermissionActions.vacantes.gestionar,
              ]}
            >
              {isOpen && (
                <VacancySheetForm open={isOpen} onOpenChange={closeModal} />
              )}
            </PermissionGuard>
          </div>
        </CardContent>
      </Card>

      {/* Detail Sheet — shown when a row is selected */}
      <VacancyDetailSheet
        vacancyId={selectedVacancyId}
        onClose={handleCloseDetail}
      />

      <BulkDeleteVacanciesDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          setBulkDeleteOpen(open);
          if (!open) {
            setSelectedBulkIds([]);
          }
        }}
        selectedIds={selectedBulkIds}
        onCompleted={handleBulkCompleted}
      />

      <BulkReassignVacanciesDialog
        open={bulkReassignOpen}
        onOpenChange={(open) => {
          setBulkReassignOpen(open);
          if (!open) {
            setSelectedBulkIds([]);
            setSelectedBulkVacancies([]);
          }
        }}
        selectedIds={selectedBulkIds}
        selectedVacancies={selectedBulkVacancies}
        onCompleted={handleBulkCompleted}
      />

      <BulkDuplicateVacanciesDialog
        open={bulkDuplicateOpen}
        onOpenChange={(open) => {
          setBulkDuplicateOpen(open);
          if (!open) {
            setSelectedBulkIds([]);
          }
        }}
        selectedIds={selectedBulkIds}
        onCompleted={handleBulkCompleted}
      />
    </>
  );
}
