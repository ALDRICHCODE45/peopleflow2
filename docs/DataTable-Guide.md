# DataTable - Guia Completa de Implementacion

Este documento explica en detalle como funcionan las tablas en PeopleFlow2 y como implementarlas con todas las features disponibles.

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Configuracion Basica](#configuracion-basica)
4. [Definicion de Columnas](#definicion-de-columnas)
5. [Features Disponibles](#features-disponibles)
6. [Paginacion Client-Side vs Server-Side](#paginacion-client-side-vs-server-side)
7. [Filtros Personalizados](#filtros-personalizados)
8. [Column Pinning (Sticky Columns)](#column-pinning-sticky-columns)
9. [Column Drag & Drop](#column-drag--drop)
10. [Seleccion de Filas y Bulk Actions](#seleccion-de-filas-y-bulk-actions)
11. [Optimizaciones de Rendimiento](#optimizaciones-de-rendimiento)
12. [Ejemplo Completo](#ejemplo-completo)

---

## Arquitectura General

El sistema de tablas esta construido sobre **TanStack Table v8** y sigue una arquitectura modular:

```
DataTable (componente principal)
├── DataTableFilters (filtros y busqueda)
├── TableBodyDataTable (headers + filas)
│   ├── DataTableColumnHeader (header con sorting, pinning, drag)
│   └── TableRow/TableCell (celdas de datos)
├── DataTablePagination (controles de paginacion)
└── DataTableBulkActionsBar (acciones en lote)
```

### Tecnologias Utilizadas

- **TanStack Table v8**: Core de la tabla (sorting, filtering, pagination, pinning, ordering)
- **@dnd-kit**: Drag and drop para reordenamiento de columnas
- **shadcn/ui**: Componentes de UI (Table, Button, DropdownMenu, etc.)
- **React Query (TanStack Query)**: Para server-side data fetching

---

## Estructura de Archivos

```
src/core/shared/
├── components/DataTable/
│   ├── DataTable.tsx              # Componente principal
│   ├── DataTableBody.tsx          # Cuerpo de la tabla (headers + rows)
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
└── hooks/
    ├── useServerPaginatedTable.ts # Hook para server-side pagination
    └── useTablePreferences.ts     # Hook para persistir preferencias
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
// features/MiFeature/frontend/components/tableConfig/MiTableConfig.tsx
import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

export const MiTableConfig: TableConfig<MiTipo> = {
  filters: {
    searchColumn: "nombre",
    searchPlaceholder: "Buscar...",
    showSearch: true,
  },
  actions: {
    showAddButton: true,
    addButtonIcon: <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />,
    addButtonText: "Nuevo Item",
    showBulkActions: false,
  },
  emptyStateMessage: "No se encontraron resultados",
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    showPageSizeSelector: true,
    showPaginationInfo: true,
  },
  enableSorting: true,
  enableRowSelection: false,
  // Features avanzadas
  columnPinning: {
    enabled: true,
    persistKey: "mi-tabla",
  },
  columnOrder: {
    enabled: true,
    persistKey: "mi-tabla",
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
// TableBodyDataTable esta memoizado
export const TableBodyDataTable = memo(TableBodyDataTableInner);

// DataTableColumnHeader esta memoizado
export const DataTableColumnHeader = memo(DataTableColumnHeaderInner);
```

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

---

## Ejemplo Completo

### Estructura de Archivos del Feature

```
features/MiFeature/
├── frontend/
│   ├── components/
│   │   └── TableView/
│   │       ├── columns/
│   │       │   └── MiColumns.tsx
│   │       ├── tableConfig/
│   │       │   ├── MiTableConfig.tsx
│   │       │   └── MiTableFilters.tsx
│   │       └── MiRowActions.tsx
│   ├── hooks/
│   │   └── useMiQuery.ts
│   ├── pages/
│   │   └── MiListPage.tsx
│   └── types/
│       └── index.ts
```

### 1. Tipos (types/index.ts)

```typescript
export interface MiItem {
  id: string;
  nombre: string;
  status: "activo" | "inactivo" | "pendiente";
  categoria: string;
  createdAt: string;
}

export type MiStatus = MiItem["status"];
```

### 2. Columnas (columns/MiColumns.tsx)

```typescript
import { ColumnDef } from "@tanstack/react-table";
import { MiItem } from "../../types";

export const MiColumns: ColumnDef<MiItem>[] = [
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
    cell: ({ row }) => format(new Date(row.getValue("createdAt")), "d MMM yyyy"),
    size: 15,
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <MiRowActions row={row} />,
    size: 10,
  },
];
```

### 3. Configuracion (tableConfig/MiTableConfig.tsx)

```typescript
import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import { MiItem } from "../../types";
import { MiTableFilters } from "./MiTableFilters";

export const MiTableConfig: TableConfig<MiItem> = {
  filters: {
    customFilter: {
      component: MiTableFilters,
      props: {
        showAddButton: true,
        addButtonText: "Nuevo Item",
      },
    },
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
    persistKey: "mi-tabla",
  },
  columnOrder: {
    enabled: true,
    persistKey: "mi-tabla",
  },
};
```

### 4. Pagina (pages/MiListPage.tsx)

```tsx
"use client";

import { useMemo, useCallback, useState } from "react";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import { MiColumns } from "../components/TableView/columns/MiColumns";
import { MiTableConfig } from "../components/TableView/tableConfig/MiTableConfig";
import { useMiPaginatedQuery } from "../hooks/useMiQuery";
import type { MiStatus } from "../types";

export function MiListPage() {
  // Estado de filtros adicionales
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Hook para paginacion server-side
  const {
    pagination,
    sorting,
    debouncedSearch,
    setPagination,
    setSorting,
    handleGlobalFilterChange,
    createPaginationHandler,
  } = useServerPaginatedTable<MiStatus>({ initialPageSize: 10 });

  // Handler para cambio de categoria
  const handleCategoryChange = useCallback((ids: string[]) => {
    setSelectedCategoryIds(ids);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [setPagination]);

  // Query con parametros del servidor
  const { data, isPending, isFetching } = useMiPaginatedQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map(s => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
    categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
  });

  const items = data?.data ?? [];
  const totalCount = data?.pagination?.totalCount ?? 0;
  const pageCount = data?.pagination?.pageCount ?? 0;

  // Configuracion de tabla con serverSide
  const tableConfig = useMemo(() => ({
    ...MiTableConfig,
    filters: {
      ...MiTableConfig.filters,
      customFilter: {
        ...MiTableConfig.filters?.customFilter,
        props: {
          ...MiTableConfig.filters?.customFilter?.props,
          onAdd: () => console.log("Agregar nuevo"),
          selectedCategoryIds,
          onCategoryChange: handleCategoryChange,
        },
      },
    },
    serverSide: {
      enabled: true,
      totalCount,
      pageCount,
    },
  }), [totalCount, pageCount, selectedCategoryIds, handleCategoryChange]);

  return (
    <DataTable
      columns={MiColumns}
      data={items}
      config={tableConfig}
      isLoading={isPending && !data}
      isFetching={isFetching}
      pagination={pagination}
      sorting={sorting}
      onPaginationChange={createPaginationHandler(totalCount)}
      onSortingChange={setSorting}
      onGlobalFilterChange={handleGlobalFilterChange}
    />
  );
}
```

---

## Checklist de Implementacion

- [ ] Definir tipos del modelo
- [ ] Crear columnas con `ColumnDef`
- [ ] Crear configuracion `TableConfig`
- [ ] (Opcional) Crear filtros personalizados
- [ ] (Opcional) Crear acciones de fila
- [ ] Implementar pagina con `DataTable`
- [ ] (Server-side) Usar `useServerPaginatedTable`
- [ ] (Server-side) Crear query paginada
- [ ] Probar features: sorting, pagination, pinning, drag
- [ ] Verificar en dark mode
- [ ] Verificar en mobile (responsive)

---

## Troubleshooting

### Los cambios de pinning/order no se reflejan

Asegurarse de pasar `columnPinning` y `columnOrder` como props al `TableBodyDataTable`.

### El memo no detecta cambios

Pasar estados como props primitivas en lugar de depender solo del objeto `table`.

### Scroll horizontal no funciona

Verificar que la suma de `size` en columnas sea cercana a 100 y que el contenedor tenga `overflow-x-auto`.

### El skeleton no desaparece

Verificar que `isLoading` sea `false` cuando hay datos y usar `isPending && !data` para carga inicial.
