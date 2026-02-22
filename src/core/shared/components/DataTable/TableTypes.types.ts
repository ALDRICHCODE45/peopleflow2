import { ReactNode } from "react";
import {
  Table,
  ColumnPinningState,
  ColumnOrderState,
} from "@tanstack/react-table";
import { IconSvgElement } from "@hugeicons/react";

// Interfaz base para filtros
export interface FilterComponentProps<TData = unknown> {
  table: Table<TData>;
  onGlobalFilterChange?: (value: string) => void;
  onExport?: (table: Table<TData>) => void;
}

// Interfaz para acciones de la tabla
export interface TableActionProps<TData = unknown> {
  table: Table<TData>;
  onAdd?: () => void;
  onExport?: (table: Table<TData>) => void;
  onRefresh?: () => void;
  customActions?: ReactNode;
}

// Interfaz base para props adicionales de filtros personalizados
export interface BaseFilterProps extends Record<string, unknown> {
  showAddButton?: boolean;
  addButtonText?: string;
  addButtonIcon?: IconSvgElement;
  onAdd?: () => void;
}

// Tipo genérico para componentes de filtros personalizados
export type CustomFilterComponent<
  TData = unknown,
  TProps extends Record<string, unknown> = BaseFilterProps,
> = {
  component: React.ComponentType<FilterComponentProps<TData> & TProps>;
  props: TProps;
};

// Interfaz para el componente de acciones personalizado
export interface CustomActionComponent<TData = unknown> {
  component: React.ComponentType<TableActionProps<TData>>;
  props?: Record<string, unknown>;
}

// Configuración de filtros
export interface FilterConfig<TData = unknown> {
  searchColumn?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  customFilter?: CustomFilterComponent<TData>;
}

// Configuración de acciones
export interface ActionConfig<TData = unknown> {
  showAddButton?: boolean;
  addButtonText?: string;
  addButtonIcon?: ReactNode;
  onAdd?: () => void;
  showExportButton?: boolean;
  onExport?: (
    table: Table<TData>,
    options?: { selectedOnly?: boolean; filteredOnly?: boolean },
  ) => void;
  exportFileName?: string;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  customActions?: ReactNode;
  customActionComponent?: CustomActionComponent<TData>;
  // Acciones bulk para filas seleccionadas
  showBulkActions?: boolean;
  onBulkDelete?: (selectedRows: TData[]) => void;
  onBulkExport?: (selectedRows: TData[]) => void;
  onBulkEdit?: (selectedRows: TData[]) => void;
  onBulkReasign?: (selectedRows: TData[]) => void;
  onBulkShare?: (selectedRows: TData[]) => void;
  bulkActionsLabel?: string;
}

// Configuración de paginación
export interface PaginationConfig {
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPaginationInfo?: boolean;
}

// Configuración para paginación server-side
export interface ServerSideConfig {
  /** Habilitar modo server-side (manualPagination, manualSorting, manualFiltering) */
  enabled: boolean;
  /** Total de registros en el servidor (para calcular páginas) */
  totalCount: number;
  /** Número total de páginas (calculado por el servidor) */
  pageCount: number;
  /** Indica si se está cargando la primera vez */
  isLoading?: boolean;
  /** Indica si se está haciendo fetch de nuevos datos (loading entre páginas) */
  isFetching?: boolean;
}

// Configuración para fijar columnas (column pinning)
export interface ColumnPinningConfig {
  /** Habilitar la funcionalidad de fijar columnas */
  enabled?: boolean;
  /** Estado inicial de columnas fijadas */
  defaultPinning?: ColumnPinningState;
  /** Key para persistir preferencias en localStorage */
  persistKey?: string;
}

// Configuración para reordenar columnas (drag & drop)
export interface ColumnOrderConfig {
  /** Habilitar la funcionalidad de reordenar columnas */
  enabled?: boolean;
  /** Orden inicial de columnas */
  defaultOrder?: ColumnOrderState;
  /** Key para persistir preferencias en localStorage */
  persistKey?: string;
}

// Configuración de la tabla
export interface TableConfig<TData> {
  filters?: FilterConfig;
  actions?: ActionConfig;
  pagination?: PaginationConfig;
  emptyStateMessage?: string;
  enableSorting?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  isLoading?: boolean;
  skeletonRows?: number;
  /** Configuración para paginación/sorting/filtrado server-side */
  serverSide?: ServerSideConfig;
  /** Configuración para fijar columnas (sticky columns) */
  columnPinning?: ColumnPinningConfig;
  /** Configuración para reordenar columnas (drag & drop) */
  columnOrder?: ColumnOrderConfig;
}
