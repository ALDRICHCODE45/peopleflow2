/**
 * Tipos genéricos para paginación server-side
 * Usados por TanStack Table con manualPagination
 */

// Parámetros de ordenamiento
export interface SortingParam {
  id: string;
  desc: boolean;
}

// Parámetros de entrada para paginación server-side
export interface ServerPaginationParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  filters?: Record<string, unknown>;
  globalFilter?: string;
}

// Información de paginación en la respuesta
export interface PaginationMeta {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
}

// Respuesta paginada genérica del servidor
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Helper para calcular pageCount
export const calculatePageCount = (
  totalCount: number,
  pageSize: number,
): number => Math.ceil(totalCount / pageSize);

// Helper para calcular skip (offset) para la base de datos
export const calculateSkip = (pageIndex: number, pageSize: number): number =>
  pageIndex * pageSize;

// Tipo para respuestas de server actions con error handling
export type PaginatedActionResponse<T> =
  | ({ error: string } & Partial<PaginatedResponse<T>>)
  | (PaginatedResponse<T> & { error?: never });
