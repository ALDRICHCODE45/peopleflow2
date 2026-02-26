# AGENTS.md — PeopleFlow2 Coding Agent Guide

## Project Overview

Multi-tenant ERP (HR/recruitment, finance, sales) built with Next.js 16, Better Auth, Prisma 7, and PostgreSQL.
Architecture follows DDD (Domain-Driven Design) with bounded contexts under `src/features/`.

---

## Commands

```bash
# Development
bun run dev                   # Start dev server

# Build & Lint
bun run build                 # Build with Turbopack
bun run lint                  # Run ESLint (eslint-config-next + TypeScript rules)

# Database
bun run db:seed               # Seed database with test users/data
bun run prisma:generate       # Regenerate Prisma client (after schema changes)
bun run prisma:studio         # Open Prisma Studio GUI
bun run prisma:deploy         # Run better:generate + db push

# Better Auth
bun run better:generate       # Regenerate Better Auth types from auth.ts config

# Cron (manual)
bun run cron:example          # Run example cron job via tsx
```

**No test framework is configured.** There are no test files, Jest, or Vitest configs.
Manual verification: run `bun run build` and `bun run lint` to validate changes.

---

## Path Aliases

```typescript
@/*          → ./src/*
@core/*      → ./src/core/*
@shadcn/*    → ./src/core/shared/ui/shadcn/*
@lib/*       → ./src/core/lib/*
@features/*  → ./src/features/*
@tenants/*   → ./src/features/tenants/*
@auth-rbac/* → ./src/features/auth-rbac/*
```

Always use these aliases — never use relative paths that traverse more than one directory level.

---

## Feature Module Structure (DDD)

Every feature under `src/features/<feature>/` must follow this exact layout:

```
features/<feature>/
├── frontend/
│   ├── components/       # React components (UI only)
│   ├── hooks/            # TanStack Query hooks (useQuery / useMutation)
│   ├── pages/            # Page-level components (composed from components + hooks)
│   ├── types/            # TypeScript interfaces and type aliases
│   └── schemas/          # Validation schemas (if needed)
└── server/
    ├── domain/
    │   ├── entities/     # Domain entity classes with private props + getters
    │   ├── interfaces/   # Repository interfaces (IXxxRepository)
    │   └── services/     # Domain services (pure business logic)
    ├── application/
    │   └── use-cases/    # Use case classes (XxxUseCase) with execute() method
    ├── infrastructure/
    │   └── repositories/ # PrismaXxxRepository implementing domain interface
    └── presentation/
        ├── actions/      # Next.js Server Actions ("use server")
        └── helpers/      # Shared helpers for actions (e.g., getActiveTenant.helper.ts)
```

---

## Code Patterns

### Server Actions

All server actions must follow this sequence:

```typescript
"use server";
import { auth } from "@lib/auth";
import { headers } from "next/headers";

export async function myAction(input: InputType): Promise<ResultType> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: "No autenticado" };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: "No hay tenant activo" };

    // Permission check
    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [PermissionActions.resource.action],
      tenantId,
    });
    if (!hasPermission) return { error: "Sin permisos" };

    // Execute use case
    const result = await new MyUseCase(repository).execute({
      ...input,
      tenantId,
    });
    if (!result.success) return { error: result.error ?? "Error" };

    revalidatePath("/path/to/revalidate");
    return { error: null, data: result.data };
  } catch (error) {
    console.error("Error in myAction:", error);
    return { error: "Error inesperado" };
  }
}
```

### Use Cases

```typescript
export class MyUseCase {
  constructor(private readonly repo: IMyRepository) {}

  async execute(input: MyInput): Promise<MyOutput> {
    try {
      // Validate inputs, run business logic
      const result = await this.repo.doSomething(input);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error in MyUseCase:", error);
      return { success: false, error: "Error message" };
    }
  }
}
```

### Repositories

- Implement the domain interface (`class PrismaXxxRepository implements IXxxRepository`)
- Export a singleton: `export const prismaXxxRepository = new PrismaXxxRepository()`
- Isolate Prisma queries; never import Prisma in use cases or domain entities
- Use `prisma.model.deleteMany/updateMany` (with `tenantId` in `where`) to enforce tenant isolation

### TanStack Query Hooks

```typescript
"use client";
// Mutations
export function useCreateXxx() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async (data) => {
      const result = await myServerAction(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      showToast({ type: "success", title: "...", description: "..." });
      queryClient.invalidateQueries({ queryKey: ["xxx", tenant?.id] });
    },
    onError: () =>
      showToast({ type: "error", title: "Error", description: "..." }),
  });
}

// Queries
export function useXxxQuery(params) {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["xxx", tenant?.id, params],
    queryFn: async () => {
      /* call server action */
    },
    enabled: !!tenant?.id,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
```

### TryCatch Result Pattern

Use when working with lower-level async operations:

```typescript
import { TryCatch } from "@/core/shared/helpers/tryCatch";
const result = await TryCatch(somePromise);
if (!result.ok) {
  /* result.error is the Error */
}
// result.value is the success value
```

### Domain Entities

- Store all data in a private `props` object
- Expose only via explicit getters
- Include domain methods (e.g., `isOpen()`, `canEdit()`, `getValidTransitions()`)
- Implement `toJSON()` returning the corresponding DTO type (dates as ISO strings)

---

## TypeScript & Formatting

- **Strict mode** is on — no `any`, no implicit `undefined`, no untyped returns on exported functions
- **No Prettier config** — code style enforced only by ESLint (`eslint-config-next/core-web-vitals` + TypeScript rules)
- Use `interface` for object shapes, `type` for unions/aliases
- Export result types from `frontend/types/<feature>.types.ts` and use them in both server actions and hooks
- Dates cross the server/client boundary as ISO strings (`string`), not `Date`
- Server-side date objects live only in domain entities and Prisma models

---

## Import Order Convention

1. React / Next.js (`"use client"` / `"use server"` directive on line 1 when needed)
2. Third-party packages
3. Internal `@lib/*`, `@core/*`, `@features/*` aliases
4. Relative imports (only within the same feature layer)

---

## Naming Conventions

| Concept              | Convention               | Example                         |
| -------------------- | ------------------------ | ------------------------------- |
| Domain entity class  | PascalCase               | `Vacancy`, `Lead`               |
| Repository interface | `IXxxRepository`         | `IVacancyRepository`            |
| Use case class       | `XxxUseCase`             | `CreateVacancyUseCase`          |
| Prisma repository    | `PrismaXxxRepository`    | `PrismaVacancyRepository`       |
| Server action file   | `*.action.ts`            | `createVacancy.action.ts`       |
| Helper file          | `*.helper.ts`            | `getActiveTenant.helper.ts`     |
| Query key factory    | `getXxxQueryKey`         | `getPaginatedVacanciesQueryKey` |
| React hook           | `useXxx`                 | `usePaginatedVacanciesQuery`    |
| Page component       | `XxxPage`                | `VacancyListPage`               |
| Permissions          | `resource:action` string | `vacantes:crear`                |

---

## Multi-Tenancy Rules

- **Always** scope Prisma queries with `tenantId` in the `where` clause
- Retrieve `tenantId` in server actions via `getActiveTenantId()` (from `getActiveTenant.helper.ts`)
- Never trust `tenantId` from client input — always pull it from the server-side session/tenant context
- Session stores `activeTenantId`; use `getCurrentTenantAction()` to resolve it

---

## Permissions

- Format: `"resource:action"` (e.g., `vacantes:crear`, `leads:acceder`)
- Constants live in `src/core/shared/constants/permissions.ts` under `PermissionActions`
- Check permissions in server actions using `CheckAnyPermissonUseCase`
- Use `<PermissionGuard permissions={[...]}>` for UI-level conditional rendering
- `super:admin` permission bypasses all checks

---

## Key Libraries

- **UI Components**: `@shadcn/*` — shadcn/ui components, never use raw HTML for form elements
- **Icons**: `@hugeicons/react` (HugeIcons)
- **Forms**: TanStack Form (`@tanstack/react-form`) or controlled `useState` — no uncontrolled inputs
- **Tables**: TanStack Table (`@tanstack/react-table`) with `DataTable` component
- **Notifications**: `showToast()` from `@/core/shared/components/ShowToast` (wraps Sonner)
- **Motion**: `motion` (Motion library) for animations
- **Date formatting**: `date-fns`
- **Phone/Country**: `libphonenumber-js`, `country-data-list`

---

## Do Not Edit

- `src/core/generated/prisma/` — auto-generated Prisma client, regenerate with `bun run prisma:generate`
- `src/proxy.ts` — Next.js proxy configuration
- `next-env.d.ts` — auto-generated Next.js types
