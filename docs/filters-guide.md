# Guia de Filtros para el Modulo de Leads

Este documento describe la arquitectura del sistema de filtros y como agregar nuevos filtros al modulo de Leads.

## Arquitectura del Sistema de Filtros

El sistema de filtros sigue una arquitectura en capas que va desde el frontend hasta la base de datos:

```
Frontend (UI) -> State Management -> Query Hooks -> Server Actions -> Use Cases -> Repository -> Prisma -> PostgreSQL
```

### Flujo de Datos

1. **Usuario interactua con filtro** (ej: selecciona rango de fechas)
2. **Estado local actualiza** con debounce para evitar queries excesivas
3. **Query hook detecta cambio** e invalida/refetch con nuevos parametros
4. **Server Action recibe params** y los parsea/valida
5. **Use Case construye filtros** para el repositorio
6. **Repository aplica filtros** en la query de Prisma
7. **Resultados retornan** por la cadena inversa

## Archivos Involucrados

### Backend

| Archivo | Responsabilidad |
|---------|-----------------|
| `server/domain/interfaces/ILeadRepository.ts` | Define tipos de filtros (`FindLeadsFilters`) |
| `server/infrastructure/repositories/PrismaLeadRepository.ts` | Implementa logica de filtrado en `buildWhereClause()` |
| `server/application/use-cases/GetPaginatedLeadsUseCase.ts` | Input interface con filtros y mapeo |
| `server/presentation/actions/getPaginatedLeadsAction.action.ts` | Params de la action y conversion de tipos |

### Frontend

| Archivo | Responsabilidad |
|---------|-----------------|
| `frontend/hooks/usePaginatedLeadsQuery.ts` | Query hook para Table View |
| `frontend/hooks/useInfiniteLeadsByStatus.ts` | Query hook para Kanban (infinite scroll) |
| `frontend/hooks/useKanbanFilters.ts` | State management para Kanban |
| `frontend/pages/LeadsListPage.tsx` | State management para Table View |
| `frontend/components/TableView/tableConfig/SheetFilters.tsx` | UI de filtros avanzados |
| `frontend/components/TableView/tableConfig/LeadsTableFilters.tsx` | Container de filtros (Table View) |
| `frontend/components/KanbanView/KanbanFilters.tsx` | Container de filtros (Kanban View) |

## Como Agregar un Nuevo Filtro

### Paso 1: Definir el Tipo de Filtro (Backend)

En `ILeadRepository.ts`, agregar el campo a `FindLeadsFilters`:

```typescript
export interface FindLeadsFilters {
  // ... filtros existentes
  miNuevoFiltro?: string[]; // o el tipo apropiado
}
```

### Paso 2: Implementar Logica de Filtrado

En `PrismaLeadRepository.ts`, agregar la condicion en `buildWhereClause()`:

```typescript
private buildWhereClause(tenantId: string, filters?: FindLeadsFilters) {
  const where: Record<string, unknown> = { /* ... */ };

  // Agregar nuevo filtro
  if (filters?.miNuevoFiltro?.length) {
    where.miCampo = { in: filters.miNuevoFiltro };
  }

  return where;
}
```

### Paso 3: Actualizar Use Case

En `GetPaginatedLeadsUseCase.ts`:

1. Agregar a la interface de input:
```typescript
filters?: {
  // ... existentes
  miNuevoFiltro?: string[];
};
```

2. Agregar al mapeo de filtros en `execute()`:
```typescript
const filters: FindLeadsFilters = {
  // ... existentes
  ...(input.filters?.miNuevoFiltro?.length && { miNuevoFiltro: input.filters.miNuevoFiltro }),
};
```

### Paso 4: Actualizar Server Action

En `getPaginatedLeadsAction.action.ts`:

1. Agregar a `GetPaginatedLeadsParams`:
```typescript
miNuevoFiltro?: string[];
```

2. Pasar al use case:
```typescript
filters: {
  // ... existentes
  miNuevoFiltro: params.miNuevoFiltro,
}
```

### Paso 5: Actualizar Query Hooks

En `usePaginatedLeadsQuery.ts` y `useInfiniteLeadsByStatus.ts`:

1. Agregar a la interface de params:
```typescript
miNuevoFiltro?: string[];
```

2. Agregar al query key para invalidacion correcta
3. Pasar a la server action

### Paso 6: Agregar Estado (Frontend)

**Para Table View** (`LeadsListPage.tsx`):
```typescript
const [selectedMiNuevoFiltro, setSelectedMiNuevoFiltro] = useState<string[]>([]);

const handleMiNuevoFiltroChange = useCallback((values: string[]) => {
  setSelectedMiNuevoFiltro(values);
  setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset paginacion
}, [setPagination]);
```

**Para Kanban View** (`useKanbanFilters.ts`):
```typescript
const [selectedMiNuevoFiltro, setSelectedMiNuevoFiltro] = useState<string[]>([]);
const debouncedMiNuevoFiltro = useDebouncedValue(selectedMiNuevoFiltro, 300);
```

### Paso 7: Agregar UI

En `SheetFilters.tsx`:
```tsx
<FilterMultiSelect
  label="Mi Nuevo Filtro"
  options={miNuevoFiltroOptions}
  selected={selectedMiNuevoFiltro}
  onChange={onMiNuevoFiltroChange}
  placeholder="Todos"
/>
```

## Consideraciones de Rendimiento

### Debounce

Usar diferentes tiempos de debounce segun el tipo de input:

- **Arrays (multi-select)**: 300ms - cambios frecuentes
- **Fechas**: 500ms - cambios mas deliberados
- **Texto libre**: 300-500ms - dependiendo del caso

### Indices de Base de Datos

Para filtros frecuentes, considerar agregar indices compuestos:

```prisma
model Lead {
  // ...
  @@index([tenantId, miNuevoCampo]) // Indice compuesto
}
```

### Memoizacion

1. Usar `useMemo` para objetos de filtros que se pasan a queries
2. Usar `arraysEqual` helper para comparaciones O(n) en lugar de JSON.stringify
3. Strings se pueden comparar directamente

### Query Keys

Los query keys de React Query deben incluir todos los filtros:

```typescript
queryKey: [
  "leads",
  "paginated",
  tenantId,
  {
    // TODOS los filtros aqui para invalidacion correcta
    pageIndex,
    pageSize,
    miNuevoFiltro,
  },
]
```

## Ejemplos de Filtros Implementados

### Filtro de Numero de Empleados

- **Tipo**: Array de strings (rangos predefinidos)
- **UI**: Multi-select con opciones fijas
- **Backend**: `{ in: [...] }` query

### Filtro de Fecha de Creacion

- **Tipo**: Rango de fechas (desde/hasta)
- **UI**: Dos inputs de tipo date
- **Backend**: `{ gte: dateFrom, lte: dateTo }` con ajuste de fin de dia

```typescript
// El "hasta" se ajusta a fin de dia para ser inclusivo
function adjustEndOfDay(dateStr: string): Date {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date;
}
```

## Testing

Al agregar un nuevo filtro, verificar:

1. **Table View**: Filtro aplica correctamente y reset de paginacion funciona
2. **Kanban View**: Filtro aplica a las 8 columnas simultaneamente
3. **Limpiar filtros**: El nuevo filtro se limpia con el boton global
4. **Rendimiento**: No hay re-renders innecesarios (React DevTools)
5. **Network**: No hay queries duplicadas (Network tab)
6. **Debounce**: Solo 1 request despues de cambiar el filtro
