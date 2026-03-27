# DataTable - Guia Completa de Implementacion

Este documento explica en detalle como funcionan las tablas en PeopleFlow2 y como implementarlas con todas las features disponibles, incluyendo operaciones CRUD completas, integracion con TanStack Query y reglas criticas de arquitectura.

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Query Keys Centralizadas](#query-keys-centralizadas)
4. [Configuracion Basica](#configuracion-basica)
5. [Definicion de Columnas](#definicion-de-columnas)
6. [Features Disponibles](#features-disponibles)
7. [Paginacion Client-Side vs Server-Side](#paginacion-client-side-vs-server-side)
8. [Integracion con TanStack Query](#integracion-con-tanstack-query)
9. [Operaciones CRUD — Patron Correcto](#operaciones-crud--patron-correcto)
10. [Reglas Criticas de Arquitectura](#reglas-criticas-de-arquitectura)
11. [Filtros Personalizados](#filtros-personalizados)
12. [Column Pinning (Sticky Columns)](#column-pinning-sticky-columns)
13. [Column Drag & Drop](#column-drag--drop)
14. [Seleccion de Filas y Bulk Actions](#seleccion-de-filas-y-bulk-actions)
15. [Optimizaciones de Rendimiento](#optimizaciones-de-rendimiento)
16. [Ejemplo Completo](#ejemplo-completo)
17. [Checklist de Implementacion](#checklist-de-implementacion)
18. [Troubleshooting](#troubleshooting)

---

## Arquitectura General

El sistema de tablas esta construido sobre **TanStack Table v8** y sigue una arquitectura modular:

```
DataTable (componente principal)
├── DataTableFilters (filtros y busqueda)
├── TableBodyDataTable (headers + filas)  ← ⚠️ Envuelto en React.memo
│   ├── DataTableColumnHeader (header con sorting, pinning, drag)
│   └── TableRow/TableCell (celdas de datos)
├── DataTablePagination (controles de paginacion)
└── DataTableBulkActionsBar (acciones en lote)
```

### Tecnologias Utilizadas

- **TanStack Table v8**: Core de la tabla (sorting, filtering, pagination, pinning, ordering)
- **@dnd-kit**: Drag and drop para reordenamiento de columnas
- **shadcn/ui**: Componentes de UI (Table, Button, DropdownMenu, etc.)
- **TanStack Query v5**: Para server-side data fetching y cache management

---

## Estructura de Archivos

```
src/core/shared/
├── components/DataTable/
│   ├── DataTable.tsx              # Componente principal
│   ├── DataTableBody.tsx          # Cuerpo de la tabla (headers + rows) — React.memo
│   ├── DataTableColumnHeader.tsx  # Header con sorting, pinning, drag
│   ├── DataTableFilters.tsx       # Filtros y busqueda
│   ├── DataTablePagination.tsx    # Controles de paginacion
│   ├── DataTableBulkActionsBar.tsx # Barra de acciones bulk
│   ├── DataTableTabs.tsx          # Tabs de filtro (single select)
│   ├── DataTableMultiTabs.tsx     # Tabs de filtro (multi select)
│   ├── TableTypes.types.ts        # Tipos e interfaces
│   ├── TableSkeleton.tsx          # Skeleton de carga
│   ├── FilterSelect.tsx           # Select para filtros
│   ├── FilterMultiSelect.tsx      # MultiSelect para filtros
│   └── helpers/
│       ├── getColumnMinWidth.helper.ts
│       └── calculateStickyOffsets.helper.ts
├── constants/
│   └── query-keys.ts              # ⚠️ Query keys centralizadas
├── helpers/
│   └── createTableConfig.ts       # Helper para crear config con handlers
└── hooks/
    ├── useServerPaginatedTable.ts # Hook para server-side pagination
    ├── useTablePreferences.ts     # Hook para persistir preferencias
    └── useModalState.ts           # Hook para estado de modales/sheets
```

---

## Query Keys Centralizadas

⚠️ **REGLA**: Todas las query keys deben definirse en `src/core/shared/constants/query-keys.ts`. NUNCA definir query keys localmente dentro de hooks.

### Ubicacion

```
src/core/shared/constants/query-keys.ts
```

### Patron

Cada modulo exporta un objeto `xxxQueryKeys` con funciones factory que retornan tuplas `as const`:

```typescript
// src/core/shared/constants/query-keys.ts

export const vacancyQueryKeys = {
  all: (tenantId: string) => ["vacancies", "paginated", tenantId] as const,
  detail: (tenantId: string, vacancyId: string) =>
    ["vacancy", "detail", tenantId, vacancyId] as const,
  attachments: (tenantId: string, vacancyId: string) =>
    ["vacancy", "attachments", tenantId, vacancyId] as const,
  assignmentHistory: (tenantId: string, vacancyId: string) =>
    ["recruiter-assignment-history", tenantId, vacancyId] as const,
};

export const leadsQueryKeys = {
  paginated: () => ["leads", "paginated"] as const,
  infinite: (tenantId: string, status: string) =>
    ["leads", "infinite", tenantId, status] as const,
  infiniteAll: () => ["leads", "infinite"] as const,
  detail: (leadId: string) => ["leads", "detail", leadId] as const,
  contacts: (leadId: string) => ["contacts", "by-lead", leadId] as const,
  interactionsByLead: (leadId: string) =>
    ["interactions", "by-lead", leadId] as const,
  interactionsByContact: (contactId: string) =>
    ["interactions", "by-contact", contactId] as const,
};

export const clientsQueryKeys = {
  paginated: (tenantId: string) =>
    ["clients", "paginated", tenantId] as const,
  detail: (tenantId: string, clientId: string) =>
    ["clients", "detail", tenantId, clientId] as const,
};
```

### Por que centralizar

1. **Consistencia**: Las mismas keys se usan en queries Y mutations para invalidacion
2. **Invalidacion correcta**: TanStack Query invalida por prefijo — si la key de invalidacion no es prefijo de la query key, no funciona
3. **Refactoring seguro**: Cambiar una key en un solo lugar actualiza queries + mutations
4. **Busqueda facil**: `Ctrl+F` en un solo archivo para encontrar todas las keys de un modulo

### Convencion de nombres

| Metodo | Descripcion | Ejemplo |
|--------|-------------|---------|
| `all(tenantId)` | Prefijo para todas las queries paginadas | `["vacancies", "paginated", tenantId]` |
| `detail(tenantId, id)` | Query de detalle individual | `["vacancy", "detail", tenantId, id]` |
| `paginated()` | Prefijo generico sin tenant | `["leads", "paginated"]` |

### Agregar query keys para un nuevo modulo

```typescript
// En src/core/shared/constants/query-keys.ts

export const miModuloQueryKeys = {
  all: (tenantId: string) => ["mi-modulo", "paginated", tenantId] as const,
  detail: (tenantId: string, itemId: string) =>
    ["mi-modulo", "detail", tenantId, itemId] as const,
};
```

---

## Configuracion Basica

### Interfaz TableConfig

```typescript
interface TableConfig<TData> {
  // Configuracion de filtros
  filters?: {
    searchColumn?: string;           // Columna para busqueda (default: "nombre")
    searchPlaceholder?: string;      // Placeholder del input
    showSearch?: boolean;            // Mostrar campo de busqueda
    customFilter?: CustomFilterComponent<TData>; // Filtros personalizados
  };

  // Configuracion de acciones
  actions?: {
    showAddButton?: boolean;
    addButtonText?: string;
    addButtonIcon?: ReactNode;
    onAdd?: () => void;
    showExportButton?: boolean;
    onExport?: (table, options?) => void;
    showRefreshButton?: boolean;
    onRefresh?: () => void;
    customActions?: ReactNode;
    // Bulk actions
    showBulkActions?: boolean;
    onBulkDelete?: (selectedRows: TData[]) => void;
    onBulkExport?: (selectedRows: TData[]) => void;
    onBulkEdit?: (selectedRows: TData[]) => void;
    onBulkShare?: (selectedRows: TData[]) => void;
  };

  // Configuracion de paginacion
  pagination?: {
    defaultPageSize?: number;        // Default: 5
    pageSizeOptions?: number[];      // Default: [5, 10, 20, 50]
    showPageSizeSelector?: boolean;
    showPaginationInfo?: boolean;
  };

  // Opciones generales
  emptyStateMessage?: string;
  enableSorting?: boolean;           // Default: true
  enableColumnVisibility?: boolean;  // Default: false
  enableRowSelection?: boolean;      // Default: false
  isLoading?: boolean;
  skeletonRows?: number;             // Default: 5

  // Server-side (ver seccion dedicada)
  serverSide?: ServerSideConfig;

  // Column Pinning (sticky columns)
  columnPinning?: {
    enabled?: boolean;
    defaultPinning?: { left: string[], right: string[] };
    persistKey?: string;  // Key para localStorage
  };

  // Column Order (drag & drop)
  columnOrder?: {
    enabled?: boolean;
    defaultOrder?: string[];
    persistKey?: string;  // Key para localStorage
  };
}
```

### Ejemplo de Configuracion

```typescript
// features/vacancy/frontend/components/tableConfig/VacanciesTableConfig.tsx
import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import type { VacancyDTO } from "../../types/vacancy.types";
import { VacanciesTableFilters } from "./VacanciesTableFilters";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, FilePlus } from "@hugeicons/core-free-icons";

export const VacanciesTableConfig: TableConfig<VacancyDTO> = {
  filters: {
    customFilter: {
      component: VacanciesTableFilters,
      props: {
        addButtonText: "Agregar Vacante",
        addButtonIcon: FilePlus,
        showAddButton: true,
      },
    },
    searchColumn: "position",
    searchPlaceholder: "Buscar vacantes...",
    showSearch: true,
  },
  actions: {
    showAddButton: true,
    addButtonIcon: <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />,
    addButtonText: "Agregar Vacante",
    showBulkActions: true,
  },
  emptyStateMessage: "No se encontraron vacantes",
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20, 50],
    showPageSizeSelector: true,
    showPaginationInfo: true,
  },
  enableColumnVisibility: true,
  enableRowSelection: true,
  enableSorting: true,
  columnPinning: {
    enabled: true,
    persistKey: "vacancies-table",
  },
  columnOrder: {
    enabled: true,
    persistKey: "vacancies-table",
  },
};
```

---

## Definicion de Columnas

Las columnas se definen usando `ColumnDef` de TanStack Table:

```typescript
// features/MiFeature/frontend/components/columns/MiColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import type { MiTipo } from "../../types";

export const MiColumns: ColumnDef<MiTipo>[] = [
  {
    // Columna basica con accessor
    header: "Nombre",
    accessorKey: "nombre",
    size: 25, // Porcentaje del ancho (suma de todas = 100)
  },
  {
    // Columna con cell personalizado
    header: "Estado",
    accessorKey: "status",
    cell: ({ row }) => <MiStatusBadge status={row.original.status} />,
    size: 15,
  },
  {
    // Columna con contenido complejo
    header: "Detalles",
    accessorKey: "detalle",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex flex-col min-w-0 overflow-hidden">
          <span className="truncate font-medium">{item.titulo}</span>
          <span className="text-xs text-muted-foreground truncate">
            {item.subtitulo}
          </span>
        </div>
      );
    },
    size: 30,
  },
  {
    // Columna de fecha
    header: "Fecha",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return format(date, "d MMM yyyy", { locale: es });
    },
    size: 15,
  },
  {
    // Columna de acciones (siempre al final)
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <MiRowActions row={row} />,
    size: 10,
    enableHiding: false,  // No se puede ocultar
    enableSorting: false, // No se puede ordenar
  },
];
```

### Propiedades Importantes de Columnas

| Propiedad | Descripcion |
|-----------|-------------|
| `accessorKey` | Key del objeto para acceder al valor |
| `accessorFn` | Funcion para calcular el valor |
| `header` | Texto o componente del header |
| `cell` | Funcion que renderiza la celda |
| `size` | Porcentaje del ancho de la tabla |
| `enableSorting` | Habilitar sorting (default: true) |
| `enableHiding` | Habilitar ocultar columna |
| `enablePinning` | Habilitar pinning de columna |

---

## Features Disponibles

### 1. Sorting (Ordenamiento)

Habilitado por defecto. Click en el header para ordenar.

```typescript
// En config
enableSorting: true, // o false para deshabilitar

// En columna especifica
{
  header: "Nombre",
  accessorKey: "nombre",
  enableSorting: false, // Deshabilitar solo esta columna
}
```

### 2. Busqueda/Filtrado

```typescript
filters: {
  searchColumn: "companyName", // Columna a filtrar
  searchPlaceholder: "Buscar leads...",
  showSearch: true,
}
```

### 3. Paginacion

```typescript
pagination: {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50, 100],
  showPageSizeSelector: true,
  showPaginationInfo: true,
}
```

### 4. Seleccion de Filas

```typescript
enableRowSelection: true,
actions: {
  showBulkActions: true,
  onBulkDelete: (rows) => console.log("Delete:", rows),
  onBulkExport: (rows) => console.log("Export:", rows),
  onBulkEdit: (rows) => console.log("Edit:", rows),
}
```

### 5. Loading States

```typescript
// En config
isLoading: true,
skeletonRows: 5, // Numero de filas skeleton

// O como props del DataTable
<DataTable
  isLoading={isPending}
  isFetching={isFetching}
/>
```

---

## Paginacion Client-Side vs Server-Side

### Client-Side (Default)

Todos los datos se cargan en memoria y la tabla maneja paginacion/sorting/filtering:

```tsx
function MiPagina() {
  const { data } = useQuery({ queryKey: ['items'], queryFn: fetchItems });

  return (
    <DataTable
      columns={MiColumns}
      data={data ?? []}
      config={MiTableConfig}
    />
  );
}
```

### Server-Side

Para grandes volumenes de datos. La paginacion/sorting/filtering se hace en el servidor:

```tsx
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";

function MiPaginaServerSide() {
  // Hook que maneja todo el estado de la tabla
  const {
    pagination,
    sorting,
    debouncedSearch,
    setPagination,
    setSorting,
    handleGlobalFilterChange,
    createPaginationHandler,
  } = useServerPaginatedTable({ initialPageSize: 10 });

  // Query con parametros del servidor
  const { data, isLoading, isFetching, isPending } = useMiQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
  });

  const items = data?.data ?? [];
  const totalCount = data?.pagination?.totalCount ?? 0;
  const pageCount = data?.pagination?.pageCount ?? 0;

  // Config con serverSide habilitado
  const tableConfig = useMemo(() => ({
    ...MiTableConfig,
    serverSide: {
      enabled: true,
      totalCount,
      pageCount,
    },
  }), [totalCount, pageCount]);

  return (
    <DataTable
      columns={MiColumns}
      data={items}
      config={tableConfig}
      isLoading={isPending && !data}
      isFetching={isFetching}
      // Props controladas para server-side
      pagination={pagination}
      sorting={sorting}
      onPaginationChange={createPaginationHandler(totalCount)}
      onSortingChange={setSorting}
      onGlobalFilterChange={handleGlobalFilterChange}
    />
  );
}
```

### Hook useServerPaginatedTable

Este hook encapsula toda la logica de estado para tablas server-side:

```typescript
const {
  // Estado
  pagination,        // { pageIndex, pageSize }
  sorting,           // [{ id, desc }]
  globalFilter,      // string (valor actual)
  debouncedSearch,   // string (valor con debounce de 300ms)
  activeTab,         // string (tab activo - single select)
  activeTabs,        // string[] (tabs activos - multi select)
  statusFilter,      // TStatus | undefined
  statusFilters,     // TStatus[]

  // Setters
  setPagination,
  setSorting,
  handleGlobalFilterChange,  // Resetea a pagina 0
  handleTabChange,           // Resetea a pagina 0
  handleMultiTabChange,      // Resetea a pagina 0

  // Utilidades
  createPaginationHandler,   // Wrapper inteligente para cambios de pageSize
} = useServerPaginatedTable<MiStatusType>({
  initialPageSize: 10,
  debounceDelay: 300,
  initialTab: "all",
});
```

---

## Integracion con TanStack Query

Esta seccion documenta los patrones CORRECTOS para conectar la tabla con el backend a traves de TanStack Query (queries y mutations).

### Query Hook — `usePaginatedXxxQuery`

El hook de query paginada es el puente entre el estado de la tabla y el server action. Debe seguir este patron exacto:

```typescript
// features/vacancy/frontend/hooks/usePaginatedVacanciesQuery.ts
"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { VacancyDTO } from "../types/vacancy.types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getPaginatedVacanciesAction } from "../../server/presentation/actions/getPaginatedVacanciesAction.action";
import type { PaginatedResponse, SortingParam } from "@/core/shared/types/pagination.types";

export interface PaginatedVacanciesQueryParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
  statuses?: VacancyStatusType[];
  // ... otros filtros especificos del modulo
}

export function usePaginatedVacanciesQuery(
  params: PaginatedVacanciesQueryParams
): UseQueryResult<PaginatedResponse<VacancyDTO>, Error> {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getPaginatedVacanciesQueryKey(tenant.id, params)
      : ["vacancies", "paginated", "no-tenant"],
    queryFn: async (): Promise<PaginatedResponse<VacancyDTO>> => {
      const result = await getPaginatedVacanciesAction(params);

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

    // ⚠️ OBLIGATORIO: Sin esto, la tabla muestra skeleton entre cambios de pagina
    enabled: !!tenant?.id,

    // ⚠️ CRITICO: Mantiene datos anteriores mientras carga nuevos (evita flash)
    placeholderData: keepPreviousData,

    // Refetch en foco deshabilitado para tablas (mejor UX)
    refetchOnWindowFocus: false,

    // Stale time para evitar refetch innecesarios
    staleTime: 30_000, // 30 segundos
  });
}
```

#### Opciones obligatorias del query hook

| Opcion | Valor | Por que |
|--------|-------|---------|
| `enabled` | `!!tenant?.id` | No ejecutar si no hay tenant activo |
| `placeholderData` | `keepPreviousData` | ⚠️ Sin esto, la tabla muestra skeleton/flash al cambiar de pagina |
| `refetchOnWindowFocus` | `false` | Evita refetch sorpresa cuando el usuario vuelve a la pestaña |
| `staleTime` | `30_000` | Evita refetch innecesarios dentro de 30 segundos |

### Mutation Hooks — Create, Update, Delete

Los mutations siguen un patron consistente. La regla mas importante:

⚠️ **`onSuccess` debe ser SYNC (fire-and-forget)** — NUNCA usar `async/await` dentro de `onSuccess`.

#### useCreateVacancy

```typescript
// features/vacancy/frontend/hooks/useCreateVacancy.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import type { CreateVacancyFormData, VacancyDTO } from "../types/vacancy.types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { createVacancyAction } from "../../server/presentation/actions/createVacancy.action";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";

export function useCreateVacancy(): UseMutationResult<VacancyDTO | undefined, Error, CreateVacancyFormData> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: CreateVacancyFormData) => {
      const result = await createVacancyAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.vacancy;
    },
    // ⚠️ SYNC — no async/await
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Vacante creada",
        description: "La vacante fue creada exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
      }
    },
    onError: () => {
      showToast({
        type: "error",
        title: "Error",
        description: "No se pudo crear la vacante",
      });
    },
  });
}
```

#### useUpdateVacancy

```typescript
// features/vacancy/frontend/hooks/useUpdateVacancy.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import type { UpdateVacancyFormData, VacancyDTO } from "../types/vacancy.types";
import { showToast } from "@/core/shared/components/ShowToast";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { updateVacancyAction } from "../../server/presentation/actions/updateVacancy.action";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";

export interface UpdateVacancyData {
  id: string;
  data: UpdateVacancyFormData;
}

export function useUpdateVacancy(): UseMutationResult<VacancyDTO | undefined, Error, UpdateVacancyData> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateVacancyData) => {
      const result = await updateVacancyAction(id, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.vacancy;
    },
    // ⚠️ SYNC — no async/await
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Vacante actualizada",
        description: "La vacante fue actualizada exitosamente",
      });
      if (tenant?.id) {
        // Invalidar detalle especifico
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.id),
        });
        // Invalidar listado paginado
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
      }
    },
    onError: () => {
      showToast({
        type: "error",
        title: "Error",
        description: "No se pudo actualizar la vacante",
      });
    },
  });
}
```

#### useDeleteVacancy

```typescript
// features/vacancy/frontend/hooks/useDeleteVacancy.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import type { DeleteVacancyResult } from "../types/vacancy.types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { deleteVacancyAction } from "../../server/presentation/actions/deleteVacancy.action";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";

export function useDeleteVacancy(): UseMutationResult<DeleteVacancyResult, Error, string> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteVacancyAction(id);
      if (!result.success) {
        throw new Error(result.error || "Error al eliminar vacante");
      }
      return result;
    },
    // ⚠️ SYNC — no async/await
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Vacante eliminada",
        description: "La vacante fue eliminada exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
      }
    },
    onError: () => {
      showToast({
        type: "error",
        title: "Error",
        description: "No se pudo eliminar la vacante",
      });
    },
  });
}
```

### Server Actions — Patron para Read vs Write

#### Read Actions (getPaginated)

Las acciones de lectura **NO** deben llamar a `revalidatePath` — solo retornan datos:

```typescript
// getPaginatedVacanciesAction.action.ts
"use server";

export async function getPaginatedVacanciesAction(
  params: GetPaginatedVacanciesParams
): Promise<PaginatedActionResponse<VacancyDTO>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: "No autenticado", data: [], pagination: {...} };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: "No hay tenant activo", data: [], pagination: {...} };

    // Permission check
    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [PermissionActions.vacantes.acceder, PermissionActions.vacantes.gestionar],
      tenantId,
    });
    if (!hasPermission) return { error: "Sin permisos", data: [], pagination: {...} };

    // Execute use case — NO revalidatePath
    const useCase = new GetPaginatedVacanciesUseCase(prismaVacancyRepository);
    const result = await useCase.execute({ tenantId, ...params });

    return result.data;
  } catch (error) {
    console.error("Error in getPaginatedVacanciesAction:", error);
    return { error: "Error al obtener vacantes", data: [], pagination: {...} };
  }
}
```

#### Write Actions (create, update, delete)

Las acciones de escritura **SI** deben llamar a `revalidatePath` despues del exito:

```typescript
// updateVacancy.action.ts
"use server";

export async function updateVacancyAction(
  id: string,
  data: UpdateVacancyFormData,
): Promise<UpdateVacancyResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: "No autenticado" };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: "No hay tenant activo" };

    // Permission check
    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [PermissionActions.vacantes.editar, PermissionActions.vacantes.gestionar],
      tenantId,
    });
    if (!hasPermission) return { error: "Sin permisos" };

    // Execute use case
    const useCase = new UpdateVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({ id, tenantId, ...data });

    if (!result.success) return { error: result.error ?? "Error" };

    // ⚠️ revalidatePath SOLO en write actions
    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, vacancy: result.vacancy?.toJSON() };
  } catch (error) {
    console.error("Error in updateVacancyAction:", error);
    return { error: "Error inesperado" };
  }
}
```

---

## Operaciones CRUD — Patron Correcto

Esta es la seccion mas importante del documento. Define el ciclo completo de operaciones CRUD para cualquier modulo con tabla.

### Create Flow

El flujo de creacion usa un dialog/sheet manejado **a nivel de pagina** con `useModalState()`.

#### 1. Configurar el boton "Agregar" en TableConfig

El boton de agregar va DENTRO del toolbar de la tabla via `showAddButton: true` en la config, NO como boton standalone a nivel de pagina:

```typescript
// TableConfig
export const MiTableConfig: TableConfig<MiDTO> = {
  actions: {
    showAddButton: true,
    addButtonText: "Agregar Item",
    addButtonIcon: <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />,
  },
  // ...
};
```

#### 2. Manejar el state del dialog de creacion en la pagina

```typescript
// MiListPage.tsx
"use client";

import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";

export function MiListPage() {
  const { isOpen, openModal, closeModal } = useModalState();

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  // Pasar onAdd a la config via createTableConfig
  const tableConfig = useMemo(
    () => createTableConfig(MiTableConfig, { onAdd: handleAdd }),
    [handleAdd]
  );

  return (
    <>
      <DataTable columns={columns} data={items} config={tableConfig} />

      {/* ⚠️ Render condicional — NO montar el componente si no esta abierto */}
      {isOpen && (
        <MiCreateDialog open={isOpen} onOpenChange={closeModal} />
      )}
    </>
  );
}
```

#### 3. El mutation hook invalida la query paginada

```typescript
// useCreateMiItem.ts — el onSuccess invalida la query paginada
onSuccess: () => {
  showToast({ type: "success", title: "Item creado", description: "..." });
  if (tenant?.id) {
    queryClient.invalidateQueries({
      queryKey: miModuloQueryKeys.all(tenant.id),
    });
  }
},
```

### Edit Flow

⚠️ **REGLA CRITICA**: El edit sheet/dialog DEBE vivir DENTRO del componente `RowActions`, NO a nivel de pagina.

#### Por que? — El problema de React.memo

`TableBodyDataTable` esta envuelto en `React.memo`:

```typescript
// DataTableBody.tsx
export const TableBodyDataTable = memo(
  TableBodyDataTableInner
) as typeof TableBodyDataTableInner;
```

Si el edit sheet vive a nivel de pagina, cuando se cierra el sheet:
1. El state cambia en la pagina → la pagina se re-renderiza
2. Pero `TableBodyDataTable` tiene `memo` → compara props → props no cambiaron → **NO se re-renderiza**
3. La tabla sigue mostrando los datos viejos

Cuando el edit sheet vive DENTRO de `RowActions` (que es un child dentro del `memo` boundary):
1. El sheet se cierra → state cambia en `RowActions`
2. `RowActions` se re-renderiza → React reconcilia el subtree
3. `table.getRowModel()` se ejecuta en el reconcile → **datos frescos aparecen**

#### Patron correcto — `RowActions` con sheets auto-contenidos

```typescript
// features/vacancy/frontend/components/columns/VacancyRowActions.tsx
"use client";

import type { Row } from "@tanstack/react-table";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { useDeleteVacancy } from "../../hooks/useDeleteVacancy";
import { useUpdateVacancy } from "../../hooks/useUpdateVacancy";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import type { VacancyDTO } from "../../types/vacancy.types";
import { VacancySheetForm } from "../VacancySheetForm";
import { VacancyActionsDropdown } from "./VacanciesActionsDropdown";
import { createVacancyActions } from "./types/VacanciesActionList";
import { LoadingModalState } from "@/core/shared/components/LoadingModalState";
import dynamic from "next/dynamic";

// Lazy-load el dialog de delete para no cargar codigo innecesario
const DeleteVacancyAlertDialog = dynamic(
  () => import("../DeleteVacancyAlertDialog").then((mod) => ({
    default: mod.DeleteColaboradorAlertDialog,
  })),
  { ssr: false, loading: () => <LoadingModalState /> }
);

interface VacancyRowActionsProps {
  row: Row<VacancyDTO>;
  onViewDetail?: (id: string) => void;
}

export function VacancyRowActions({ row, onViewDetail }: VacancyRowActionsProps) {
  const vacancy = row.original;
  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canEdit = isSuperAdmin || hasAnyPermission([
    PermissionActions.vacantes.editar,
    PermissionActions.vacantes.gestionar,
  ]);

  const canDelete = isSuperAdmin || hasAnyPermission([
    PermissionActions.vacantes.eliminar,
    PermissionActions.vacantes.gestionar,
  ]);

  // ⚠️ useModalState DENTRO de RowActions — NO a nivel de pagina
  const {
    isOpen: isDeleteOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModalState();

  const {
    isOpen: isUpdateModalOpen,
    openModal: openUpdateModal,
    closeModal: closeUpdateModal,
  } = useModalState();

  const deleteVacancyMutation = useDeleteVacancy();
  const updateVacancyMutation = useUpdateVacancy();

  const handleDelete = async () => {
    await deleteVacancyMutation.mutateAsync(vacancy.id);
    closeDeleteModal();
  };

  const actions = createVacancyActions(
    canEdit ? openUpdateModal : undefined,
    canDelete ? openDeleteModal : undefined,
    onViewDetail ? () => onViewDetail(vacancy.id) : undefined,
  );

  return (
    <>
      <VacancyActionsDropdown actions={actions} />

      {/* ⚠️ Delete dialog — render condicional DENTRO de RowActions */}
      <PermissionGuard permissions={[
        PermissionActions.vacantes.eliminar,
        PermissionActions.vacantes.gestionar,
      ]}>
        {isDeleteOpen && (
          <DeleteVacancyAlertDialog
            isOpen={isDeleteOpen}
            onOpenChange={closeDeleteModal}
            onConfirmDelete={handleDelete}
            vacancyToDelete={vacancy.position}
            isLoading={deleteVacancyMutation.isPending}
          />
        )}
      </PermissionGuard>

      {/* ⚠️ Edit sheet — render condicional DENTRO de RowActions */}
      <PermissionGuard permissions={[
        PermissionActions.vacantes.editar,
        PermissionActions.vacantes.gestionar,
      ]}>
        {isUpdateModalOpen && (
          <VacancySheetForm
            vacancy={vacancy}
            onOpenChange={closeUpdateModal}
            open
          />
        )}
      </PermissionGuard>
    </>
  );
}
```

### Delete Flow

El delete sigue el mismo patron que edit — el confirm dialog vive DENTRO de `RowActions`:

1. `useModalState()` para el estado del confirm dialog
2. `useDeleteVacancy()` mutation hook
3. Al confirmar: `await deleteVacancyMutation.mutateAsync(vacancy.id)`
4. El `onSuccess` del mutation invalida la query paginada → tabla se refresca

### Detail View Flow

Para ver detalle de un item, hay dos opciones:

**Opcion A — Sheet manejado a nivel de pagina** (el patron de vacantes):

```typescript
export function VacancyListPage() {
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null);

  const handleViewDetail = useCallback((id: string) => {
    setSelectedVacancyId(id);
  }, []);

  // Pasar handler a las columnas
  const columns = useMemo(
    () => createVacancyColumns(handleViewDetail),
    [handleViewDetail]
  );

  return (
    <>
      <DataTable columns={columns} data={vacancies} config={tableConfig} />

      <VacancyDetailSheet
        vacancyId={selectedVacancyId}
        onClose={() => setSelectedVacancyId(null)}
      />
    </>
  );
}
```

Nota: El detail sheet a nivel de pagina funciona correctamente porque es de **solo lectura** — no modifica datos, asi que no hay problema con el `React.memo`.

**Opcion B — Click en la fila redirige a una pagina de detalle** (para modulos complejos).

---

## Reglas Criticas de Arquitectura

⚠️ Estas reglas son **obligatorias** para cualquier implementacion de tabla con CRUD. Violarlas produce bugs dificiles de debuggear.

### 1. NUNCA manejar el state del edit sheet a nivel de pagina

El edit sheet DEBE vivir DENTRO del componente `RowActions`.

**MAL** ❌:
```typescript
// MiListPage.tsx — INCORRECTO
export function MiListPage() {
  const [editingItem, setEditingItem] = useState<MiDTO | null>(null);

  return (
    <>
      <DataTable columns={columns} data={items} config={config} />
      {/* ❌ El sheet esta FUERA del memo boundary de la tabla */}
      {editingItem && (
        <EditSheet item={editingItem} onClose={() => setEditingItem(null)} />
      )}
    </>
  );
}
```

**BIEN** ✅:
```typescript
// MiRowActions.tsx — CORRECTO
export function MiRowActions({ row }: { row: Row<MiDTO> }) {
  const { isOpen, openModal, closeModal } = useModalState();

  return (
    <>
      <DropdownMenu>...</DropdownMenu>
      {/* ✅ El sheet esta DENTRO del subtree de la tabla */}
      {isOpen && <EditSheet item={row.original} onClose={closeModal} />}
    </>
  );
}
```

**Por que**: `TableBodyDataTable` esta envuelto en `React.memo`. Los cambios de state en la pagina no hacen que la tabla se re-renderice, asi que los datos editados no aparecen hasta el proximo refetch. Cuando el sheet esta dentro de `RowActions`, el cierre del sheet causa un re-render del subtree que SI ejecuta `table.getRowModel()` con datos frescos.

### 2. SIEMPRE usar `useModalState()` en vez de `useState(false)` para dialogs/sheets

```typescript
// ⚠️ Usar el hook estandarizado
import { useModalState } from "@/core/shared/hooks/useModalState";

// NO hacer esto:
const [isOpen, setIsOpen] = useState(false); // ❌

// SI hacer esto:
const { isOpen, openModal, closeModal } = useModalState(); // ✅
```

El hook vive en `src/core/shared/hooks/useModalState.ts` y provee una API consistente.

### 3. SIEMPRE usar `keepPreviousData` en queries paginadas

```typescript
import { keepPreviousData } from "@tanstack/react-query";

// ⚠️ Sin esto, al cambiar de pagina la tabla muestra skeleton/flash
placeholderData: keepPreviousData, // ✅ OBLIGATORIO
```

### 4. SIEMPRE usar query keys centralizadas

```typescript
// ❌ NUNCA definir keys localmente
queryClient.invalidateQueries({
  queryKey: ["vacancies", "paginated", tenant.id], // ❌
});

// ✅ SIEMPRE usar keys centralizadas
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";

queryClient.invalidateQueries({
  queryKey: vacancyQueryKeys.all(tenant.id), // ✅
});
```

### 5. `onSuccess` de mutations debe ser SYNC — nunca async/await

```typescript
// ❌ INCORRECTO — async onSuccess
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ... }); // ❌
},

// ✅ CORRECTO — sync fire-and-forget
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ... }); // ✅ fire-and-forget
},
```

**Por que**: `invalidateQueries` ya retorna una Promise, pero no necesitas esperarla. Si usas `async/await`, creas una race condition con `revalidatePath` del server action — el `revalidatePath` ya esta invalidando el cache de Next.js en el servidor, y la invalidacion de TanStack Query en el cliente es para refrescar la UI. Si esperamos la invalidacion, puede haber un timing conflict donde la data vieja se cachea antes de que el server responda con la nueva.

### 6. El boton "Agregar" debe ir DENTRO del toolbar de la tabla

```typescript
// ❌ INCORRECTO — boton standalone fuera de la tabla
<div>
  <Button onClick={handleAdd}>Agregar</Button>  {/* ❌ */}
  <DataTable ... />
</div>

// ✅ CORRECTO — configurado via TableConfig
export const MiTableConfig: TableConfig<MiDTO> = {
  actions: {
    showAddButton: true,               // ✅
    addButtonText: "Agregar Item",
    onAdd: handleAdd,  // Se pasa via createTableConfig
  },
};
```

---

## Filtros Personalizados

Para filtros mas complejos, puedes crear un componente de filtros personalizado:

### 1. Crear el Componente de Filtros

```tsx
// features/MiFeature/frontend/components/MiTableFilters.tsx
import { BaseFilterProps } from "@/core/shared/components/DataTable/TableTypes.types";
import { Table } from "@tanstack/react-table";

interface MiTableFiltersProps extends BaseFilterProps {
  table: Table<unknown>;
  onGlobalFilterChange?: (value: string) => void;
  // Props adicionales controladas
  selectedCategoryIds?: string[];
  onCategoryChange?: (ids: string[]) => void;
}

export function MiTableFilters({
  table,
  onGlobalFilterChange,
  showAddButton,
  addButtonText,
  onAdd,
  selectedCategoryIds = [],
  onCategoryChange,
}: MiTableFiltersProps) {
  return (
    <Card>
      <CardContent>
        {/* Tu UI de filtros personalizada */}
        <Input
          placeholder="Buscar..."
          onChange={(e) => onGlobalFilterChange?.(e.target.value)}
        />

        <FilterMultiSelect
          label="Categoria"
          options={categoryOptions}
          selected={selectedCategoryIds}
          onChange={onCategoryChange}
        />

        {showAddButton && (
          <Button onClick={onAdd}>{addButtonText}</Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### 2. Usar en la Configuracion

```typescript
export const MiTableConfig: TableConfig<MiTipo> = {
  filters: {
    customFilter: {
      component: MiTableFilters,
      props: {
        showAddButton: true,
        addButtonText: "Nuevo",
      },
    },
  },
  // ... resto de config
};
```

### 3. Pasar Props Controladas

```tsx
function MiPagina() {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const tableConfig = useMemo(() => createTableConfig(MiTableConfig, {
    onAdd: handleAdd,
    selectedCategoryIds,
    onCategoryChange: setSelectedCategoryIds,
  }), [selectedCategoryIds]);

  return <DataTable config={tableConfig} ... />;
}
```

---

## Column Pinning (Sticky Columns)

Permite fijar columnas a la izquierda o derecha para que permanezcan visibles durante el scroll horizontal.

### Habilitar en Configuracion

```typescript
export const MiTableConfig: TableConfig<MiTipo> = {
  // ...
  columnPinning: {
    enabled: true,
    persistKey: "mi-tabla", // Guarda preferencias en localStorage
    defaultPinning: {
      left: ["nombre"],     // Columnas fijadas a la izquierda por defecto
      right: ["actions"],   // Columnas fijadas a la derecha por defecto
    },
  },
};
```

### Como Funciona

1. Cada header muestra un menu (icono `...`) cuando `columnPinning.enabled = true`
2. El menu tiene opciones:
   - "Fijar a la izquierda"
   - "Fijar a la derecha"
   - "Desfijar columna" (si ya esta fijada)
3. Las columnas fijadas:
   - Se mantienen visibles durante scroll horizontal
   - Tienen `position: sticky` con offsets calculados
   - Muestran un icono de pin y una sombra sutil
4. Las preferencias se guardan en `localStorage` si se especifica `persistKey`

### Estilos Aplicados

```css
/* Columnas fijadas a la izquierda */
position: sticky;
left: [offset calculado];
z-index: 2;
background-color: var(--background);
box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.1);

/* Columnas fijadas a la derecha */
position: sticky;
right: [offset calculado];
z-index: 1;
background-color: var(--background);
box-shadow: -2px 0 4px -2px rgba(0, 0, 0, 0.1);
```

---

## Column Drag & Drop

Permite reordenar columnas arrastrandolas.

### Habilitar en Configuracion

```typescript
export const MiTableConfig: TableConfig<MiTipo> = {
  // ...
  columnOrder: {
    enabled: true,
    persistKey: "mi-tabla", // Guarda preferencias en localStorage
    defaultOrder: ["nombre", "estado", "fecha", "actions"], // Orden inicial
  },
};
```

### Como Funciona

1. Cada header muestra un drag handle (icono de arrastre) cuando `columnOrder.enabled = true`
2. Las columnas fijadas (pinned) NO se pueden arrastrar
3. Al arrastrar una columna sobre otra, se reordena la tabla
4. Las preferencias se guardan en `localStorage` si se especifica `persistKey`

### Implementacion Tecnica

- Usa `@dnd-kit/core` y `@dnd-kit/sortable`
- `DndContext` envuelve la tabla
- `SortableContext` con `horizontalListSortingStrategy`
- `useSortable` en cada header para el drag
- `PointerSensor` con 5px de distancia de activacion

---

## Seleccion de Filas y Bulk Actions

### Habilitar Seleccion

```typescript
export const MiTableConfig: TableConfig<MiTipo> = {
  enableRowSelection: true,
  actions: {
    showBulkActions: true,
    onBulkDelete: (selectedRows) => {
      console.log("Eliminar:", selectedRows);
    },
    onBulkExport: (selectedRows) => {
      console.log("Exportar:", selectedRows);
    },
    onBulkEdit: (selectedRows) => {
      console.log("Editar:", selectedRows);
    },
    onBulkShare: (selectedRows) => {
      console.log("Compartir:", selectedRows);
    },
  },
};
```

### Columna de Seleccion

Para agregar checkboxes, agrega esta columna al inicio:

```typescript
import { Checkbox } from "@shadcn/checkbox";

export const MiColumns: ColumnDef<MiTipo>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todas"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    size: 4,
    enableSorting: false,
    enableHiding: false,
  },
  // ... resto de columnas
];
```

### Barra de Bulk Actions

Cuando hay filas seleccionadas, aparece una barra en la parte inferior con las acciones configuradas.

---

## Optimizaciones de Rendimiento

El sistema de tablas incluye varias optimizaciones para manejar miles de filas:

### 1. Memoizacion de Componentes

```typescript
// TableBodyDataTable esta memoizado — ⚠️ CRITICO para entender la arquitectura CRUD
export const TableBodyDataTable = memo(TableBodyDataTableInner);

// DataTableColumnHeader esta memoizado
export const DataTableColumnHeader = memo(DataTableColumnHeaderInner);
```

> **Implicancia**: Cualquier state que controle un sheet/dialog de edicion DEBE vivir DENTRO del subtree de la tabla (en `RowActions`), no a nivel de pagina. Ver [Reglas Criticas de Arquitectura](#reglas-criticas-de-arquitectura).

### 2. Memoizacion de Calculos

```typescript
// Calculos costosos estan memoizados
const stickyOffsets = useMemo(() => {
  return calculateStickyOffsets(table);
}, [table, columnPinningState]);

const columnIds = useMemo(() => {
  return table.getAllLeafColumns().map(col => col.id);
}, [table, columnPinningState]);
```

### 3. useCallback para Handlers

```typescript
const handleDragEnd = useCallback((event) => {
  // ...
}, [columnIds, table]);

const getColumnPinPosition = useCallback((columnId) => {
  // ...
}, [columnPinningState]);
```

### 4. Props Explicitas para Detectar Cambios

Para que `memo()` detecte cambios correctamente, el estado se pasa como props explicitas:

```tsx
<TableBodyDataTable
  table={table}
  config={config}
  columnPinning={columnPinning}  // Prop explicita
  columnOrder={columnOrder}      // Prop explicita
  rowSelection={rowSelection}    // Prop explicita
  columnVisibility={columnVisibility} // Prop explicita
/>
```

### 5. Persistencia con useTablePreferences

```typescript
const {
  columnPinning,
  columnOrder,
  setColumnPinning,
  setColumnOrder,
} = useTablePreferences({
  persistKey: "mi-tabla",
  defaultPinning: { left: [], right: [] },
  defaultOrder: [],
});
```

Este hook:
- Carga preferencias desde `localStorage` al montar
- Guarda cambios automaticamente
- Es SSR-safe (usa lazy initializer)

### 6. Lazy Loading de Dialogs con `dynamic()`

Los dialogs pesados (como el de confirmacion de delete) se cargan lazy para no afectar el bundle inicial:

```typescript
const DeleteAlertDialog = dynamic(
  () => import("../DeleteAlertDialog").then((mod) => ({ default: mod.DeleteAlertDialog })),
  { ssr: false, loading: () => <LoadingModalState /> }
);
```

---

## Ejemplo Completo

Este ejemplo muestra un modulo completo con query paginada, CRUD (crear, editar, eliminar), query keys centralizadas y todos los patrones correctos.

### Estructura de Archivos del Feature

```
features/MiFeature/
├── frontend/
│   ├── components/
│   │   ├── columns/
│   │   │   ├── MiColumns.tsx            # Definicion de columnas
│   │   │   └── MiRowActions.tsx         # ⚠️ Acciones con edit/delete sheets DENTRO
│   │   ├── tableConfig/
│   │   │   └── MiTableConfig.tsx        # Configuracion de la tabla
│   │   ├── MiCreateSheet.tsx            # Sheet de creacion
│   │   └── MiEditSheet.tsx              # Sheet de edicion
│   ├── hooks/
│   │   ├── usePaginatedMiQuery.ts       # Query paginada
│   │   ├── useCreateMiItem.ts           # Mutation de creacion
│   │   ├── useUpdateMiItem.ts           # Mutation de edicion
│   │   └── useDeleteMiItem.ts           # Mutation de eliminacion
│   ├── pages/
│   │   └── MiListPage.tsx               # Pagina con DataTable
│   └── types/
│       └── miItem.types.ts              # Tipos del modulo
└── server/
    └── presentation/
        └── actions/
            ├── getPaginatedMiItems.action.ts   # Read (NO revalidatePath)
            ├── createMiItem.action.ts          # Write (SI revalidatePath)
            ├── updateMiItem.action.ts          # Write (SI revalidatePath)
            └── deleteMiItem.action.ts          # Write (SI revalidatePath)
```

### 1. Query Keys (constants/query-keys.ts)

```typescript
// Agregar al archivo centralizado
export const miItemQueryKeys = {
  all: (tenantId: string) => ["mi-items", "paginated", tenantId] as const,
  detail: (tenantId: string, itemId: string) =>
    ["mi-items", "detail", tenantId, itemId] as const,
};
```

### 2. Tipos (types/miItem.types.ts)

```typescript
export interface MiItemDTO {
  id: string;
  nombre: string;
  status: "activo" | "inactivo" | "pendiente";
  categoria: string;
  createdAt: string; // ISO string — siempre string en el boundary client/server
}

export type MiItemStatus = MiItemDTO["status"];

export interface CreateMiItemFormData {
  nombre: string;
  categoria: string;
}

export interface UpdateMiItemFormData {
  nombre?: string;
  categoria?: string;
  status?: MiItemStatus;
}
```

### 3. Query Hook (hooks/usePaginatedMiQuery.ts)

```typescript
"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getPaginatedMiItemsAction } from "../../server/presentation/actions/getPaginatedMiItems.action";
import { miItemQueryKeys } from "@core/shared/constants/query-keys";
import type { PaginatedResponse, SortingParam } from "@/core/shared/types/pagination.types";
import type { MiItemDTO } from "../types/miItem.types";

export interface PaginatedMiItemsParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
}

export function usePaginatedMiQuery(params: PaginatedMiItemsParams) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? [...miItemQueryKeys.all(tenant.id), params]
      : ["mi-items", "no-tenant"],
    queryFn: async (): Promise<PaginatedResponse<MiItemDTO>> => {
      const result = await getPaginatedMiItemsAction(params);
      if ("error" in result && result.error) throw new Error(result.error);
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
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
}
```

### 4. Mutation Hooks

```typescript
// hooks/useCreateMiItem.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { createMiItemAction } from "../../server/presentation/actions/createMiItem.action";
import { showToast } from "@/core/shared/components/ShowToast";
import { miItemQueryKeys } from "@core/shared/constants/query-keys";
import type { CreateMiItemFormData, MiItemDTO } from "../types/miItem.types";

export function useCreateMiItem() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: CreateMiItemFormData) => {
      const result = await createMiItemAction(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      showToast({ type: "success", title: "Item creado", description: "El item fue creado exitosamente" });
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: miItemQueryKeys.all(tenant.id) });
      }
    },
    onError: () => {
      showToast({ type: "error", title: "Error", description: "No se pudo crear el item" });
    },
  });
}
```

```typescript
// hooks/useUpdateMiItem.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { updateMiItemAction } from "../../server/presentation/actions/updateMiItem.action";
import { showToast } from "@/core/shared/components/ShowToast";
import { miItemQueryKeys } from "@core/shared/constants/query-keys";
import type { UpdateMiItemFormData, MiItemDTO } from "../types/miItem.types";

export function useUpdateMiItem() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMiItemFormData }) => {
      const result = await updateMiItemAction(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      showToast({ type: "success", title: "Item actualizado", description: "El item fue actualizado exitosamente" });
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: miItemQueryKeys.detail(tenant.id, variables.id) });
        queryClient.invalidateQueries({ queryKey: miItemQueryKeys.all(tenant.id) });
      }
    },
    onError: () => {
      showToast({ type: "error", title: "Error", description: "No se pudo actualizar el item" });
    },
  });
}
```

```typescript
// hooks/useDeleteMiItem.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { deleteMiItemAction } from "../../server/presentation/actions/deleteMiItem.action";
import { showToast } from "@/core/shared/components/ShowToast";
import { miItemQueryKeys } from "@core/shared/constants/query-keys";

export function useDeleteMiItem() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteMiItemAction(id);
      if (!result.success) throw new Error(result.error || "Error al eliminar");
      return result;
    },
    onSuccess: () => {
      showToast({ type: "success", title: "Item eliminado", description: "El item fue eliminado exitosamente" });
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: miItemQueryKeys.all(tenant.id) });
      }
    },
    onError: () => {
      showToast({ type: "error", title: "Error", description: "No se pudo eliminar el item" });
    },
  });
}
```

### 5. Columnas (columns/MiColumns.tsx)

```typescript
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { MiItemDTO } from "../../types/miItem.types";
import { MiRowActions } from "./MiRowActions";

export const MiColumns: ColumnDef<MiItemDTO>[] = [
  {
    header: "Nombre",
    accessorKey: "nombre",
    size: 30,
  },
  {
    header: "Estado",
    accessorKey: "status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    size: 20,
  },
  {
    header: "Categoria",
    accessorKey: "categoria",
    size: 25,
  },
  {
    header: "Creado",
    accessorKey: "createdAt",
    cell: ({ row }) => format(new Date(row.getValue("createdAt")), "d MMM yyyy", { locale: es }),
    size: 15,
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <MiRowActions row={row} />,
    size: 10,
    enableHiding: false,
    enableSorting: false,
  },
];
```

### 6. Row Actions con Edit/Delete auto-contenidos (columns/MiRowActions.tsx)

```typescript
"use client";

import type { Row } from "@tanstack/react-table";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { useDeleteMiItem } from "../../hooks/useDeleteMiItem";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import type { MiItemDTO } from "../../types/miItem.types";
import { MiEditSheet } from "../MiEditSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shadcn/dropdown-menu";
import { Button } from "@shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";

interface MiRowActionsProps {
  row: Row<MiItemDTO>;
}

export function MiRowActions({ row }: MiRowActionsProps) {
  const item = row.original;
  const { isSuperAdmin } = usePermissions();

  // ⚠️ State de modales DENTRO de RowActions
  const {
    isOpen: isEditOpen,
    openModal: openEdit,
    closeModal: closeEdit,
  } = useModalState();

  const {
    isOpen: isDeleteOpen,
    openModal: openDelete,
    closeModal: closeDelete,
  } = useModalState();

  const deleteMutation = useDeleteMiItem();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(item.id);
    closeDelete();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openEdit}>Editar</DropdownMenuItem>
          <DropdownMenuItem onClick={openDelete} className="text-destructive">
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ⚠️ Edit sheet — DENTRO de RowActions */}
      {isEditOpen && (
        <MiEditSheet item={item} open={isEditOpen} onOpenChange={closeEdit} />
      )}

      {/* ⚠️ Delete dialog — DENTRO de RowActions */}
      {isDeleteOpen && (
        <DeleteConfirmDialog
          isOpen={isDeleteOpen}
          onClose={closeDelete}
          onConfirm={handleDelete}
          itemName={item.nombre}
          isLoading={deleteMutation.isPending}
        />
      )}
    </>
  );
}
```

### 7. Table Config (tableConfig/MiTableConfig.tsx)

```typescript
import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import type { MiItemDTO } from "../../types/miItem.types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

export const MiTableConfig: TableConfig<MiItemDTO> = {
  filters: {
    searchColumn: "nombre",
    searchPlaceholder: "Buscar items...",
    showSearch: true,
  },
  actions: {
    showAddButton: true,
    addButtonIcon: <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />,
    addButtonText: "Nuevo Item",
  },
  emptyStateMessage: "No se encontraron items",
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    showPageSizeSelector: true,
    showPaginationInfo: true,
  },
  enableSorting: true,
  enableRowSelection: false,
  columnPinning: {
    enabled: true,
    persistKey: "mi-items-table",
  },
  columnOrder: {
    enabled: true,
    persistKey: "mi-items-table",
  },
};
```

### 8. Pagina (pages/MiListPage.tsx)

```typescript
"use client";

import { useMemo, useCallback } from "react";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { MiColumns } from "../components/columns/MiColumns";
import { MiTableConfig } from "../components/tableConfig/MiTableConfig";
import { usePaginatedMiQuery } from "../hooks/usePaginatedMiQuery";
import { MiCreateSheet } from "../components/MiCreateSheet";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";

export function MiListPage() {
  // Create dialog — a nivel de pagina (porque es CREATE, no edit)
  const { isOpen, openModal, closeModal } = useModalState();

  // Server-side pagination state
  const {
    pagination,
    sorting,
    debouncedSearch,
    setSorting,
    handleGlobalFilterChange,
    createPaginationHandler,
  } = useServerPaginatedTable({ initialPageSize: 10 });

  // Query paginada
  const { data, isFetching, isPending } = usePaginatedMiQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
  });

  const items = data?.data ?? [];
  const totalCount = data?.pagination?.totalCount ?? 0;
  const pageCount = data?.pagination?.pageCount ?? 0;
  const showInitialLoading = isPending && !data;

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  // Config con serverSide y handler de add
  const tableConfig = useMemo(
    () =>
      createTableConfig(MiTableConfig, {
        onAdd: handleAdd,
        serverSide: {
          enabled: true,
          totalCount,
          pageCount,
        },
      }),
    [totalCount, pageCount, handleAdd]
  );

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          <TablePresentation
            title="Gestion de Items"
            subtitle="Administra los items de tu organizacion"
          />

          <DataTable
            columns={MiColumns}
            data={items}
            config={tableConfig}
            isLoading={showInitialLoading}
            isFetching={isFetching && !showInitialLoading}
            pagination={pagination}
            sorting={sorting}
            onPaginationChange={createPaginationHandler(totalCount)}
            onSortingChange={setSorting}
            onGlobalFilterChange={handleGlobalFilterChange}
          />

          {/* Create dialog — render condicional a nivel de pagina */}
          {isOpen && (
            <MiCreateSheet open={isOpen} onOpenChange={closeModal} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Checklist de Implementacion

### Estructura basica
- [ ] Definir tipos del modelo en `frontend/types/`
- [ ] Agregar query keys centralizadas en `src/core/shared/constants/query-keys.ts`
- [ ] Crear columnas con `ColumnDef` en `frontend/components/columns/`
- [ ] Crear configuracion `TableConfig` en `frontend/components/tableConfig/`
- [ ] Implementar pagina con `DataTable` en `frontend/pages/`

### Server Actions
- [ ] Server action de lectura (getPaginated) — NO `revalidatePath`
- [ ] Server action de creacion — SI `revalidatePath`
- [ ] Server action de edicion — SI `revalidatePath`
- [ ] Server action de eliminacion — SI `revalidatePath`

### Query & Mutations
- [ ] Query hook usa `placeholderData: keepPreviousData`
- [ ] Query hook usa `staleTime: 30_000`
- [ ] Query hook usa `refetchOnWindowFocus: false`
- [ ] Query hook usa `enabled: !!tenant?.id`
- [ ] Mutations usan `onSuccess` sync (fire-and-forget, sin async/await)
- [ ] Mutations invalidan con query keys centralizadas

### CRUD UI
- [ ] Edit sheet vive DENTRO de `RowActions` (NO a nivel de pagina)
- [ ] Delete dialog vive DENTRO de `RowActions`
- [ ] Create dialog usa `useModalState()` y render condicional `{isOpen && <.../>}`
- [ ] Boton "Agregar" configurado via `showAddButton` en TableConfig

### Features avanzadas
- [ ] (Opcional) Crear filtros personalizados
- [ ] (Server-side) Usar `useServerPaginatedTable`
- [ ] (Server-side) Crear query paginada
- [ ] Probar features: sorting, pagination, pinning, drag
- [ ] Verificar en dark mode
- [ ] Verificar en mobile (responsive)

---

## Troubleshooting

### La tabla no se refresca despues de editar

⚠️ **Causa mas comun**: El edit sheet esta a nivel de pagina en vez de dentro de `RowActions`.

`TableBodyDataTable` esta envuelto en `React.memo`. Si el edit sheet vive a nivel de pagina, al cerrarlo el state cambia en la pagina pero el memo impide que la tabla se re-renderice.

**Solucion**: Mover el edit sheet DENTRO de `RowActions`. Ver seccion [Reglas Criticas de Arquitectura](#reglas-criticas-de-arquitectura).

### Flash/skeleton al cambiar de pagina

**Causa**: Falta `placeholderData: keepPreviousData` en el query hook.

Sin `keepPreviousData`, cuando cambian los parametros (pagina, filtro), TanStack Query descarta los datos anteriores y muestra loading/skeleton hasta que llegan los nuevos.

**Solucion**:
```typescript
import { keepPreviousData } from "@tanstack/react-query";

return useQuery({
  // ...
  placeholderData: keepPreviousData, // ⚠️ OBLIGATORIO para tablas paginadas
});
```

### Invalidation no funciona (la tabla no se refresca despues de crear/editar/eliminar)

**Causa**: Las query keys de invalidacion no son prefijo de la query key completa de la query.

TanStack Query invalida por **prefijo**. Si tu query key es `["mi-items", "paginated", tenantId, { pageIndex: 0, ... }]` y tu invalidacion usa `["items", "paginated", tenantId]` (nombre diferente), no matchea.

**Solucion**: Usar las query keys centralizadas tanto en la query como en la invalidacion:

```typescript
// En el query hook
queryKey: [...miItemQueryKeys.all(tenant.id), params],

// En la mutation
queryClient.invalidateQueries({
  queryKey: miItemQueryKeys.all(tenant.id), // Es prefijo de la query key ✅
});
```

### Los cambios de pinning/order no se reflejan

Asegurarse de pasar `columnPinning` y `columnOrder` como props al `TableBodyDataTable`.

### El memo no detecta cambios

Pasar estados como props primitivas en lugar de depender solo del objeto `table`.

### Scroll horizontal no funciona

Verificar que la suma de `size` en columnas sea cercana a 100 y que el contenedor tenga `overflow-x-auto`.

### El skeleton no desaparece

Verificar que `isLoading` sea `false` cuando hay datos y usar `isPending && !data` para carga inicial.
