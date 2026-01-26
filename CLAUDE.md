# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PeopleFlow2 is a multi-tenant ERP system built with Next.js 16, focused on HR/recruitment, finance, and sales/lead management. It uses a DDD (Domain-Driven Design) architecture with Better Auth for authentication and Prisma with PostgreSQL for data persistence.

## Common Commands

```bash
# Development
bun run dev              # Start Next.js dev server

# Database
bun run db:seed          # Seed database with test data
bun run prisma:generate  # Generate Prisma client
bun run prisma:studio    # Open Prisma Studio GUI

# Better Auth
bun run better:generate  # Generate Better Auth types

# Linting
bun run lint             # Run ESLint
```

## Architecture

### Directory Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── (Dashboard)/          # Protected dashboard routes
│   ├── (Auth)/               # Auth-required routes (select-tenant)
│   ├── (Sign-In)/            # Public sign-in pages
│   └── (SuperAdmin)/         # Super admin routes
├── core/                     # Shared core functionality
│   ├── lib/                  # Auth, Prisma, permissions services
│   ├── shared/               # Shared components, hooks, helpers
│   │   ├── ui/shadcn/        # shadcn/ui components
│   │   └── ui/sidebar/       # Sidebar navigation
│   └── generated/prisma/     # Generated Prisma client (do not edit)
└── features/                 # Feature modules (DDD bounded contexts)
```

### Feature Module Structure (DDD Pattern)

Each feature follows this structure:
```
features/<feature-name>/
├── frontend/
│   ├── components/           # React components
│   ├── hooks/                # React Query hooks
│   ├── pages/                # Page components
│   ├── types/                # TypeScript types
│   └── schemas/              # Validation schemas
└── server/
    ├── domain/
    │   ├── entities/         # Domain entities
    │   ├── interfaces/       # Repository interfaces
    │   └── services/         # Domain services
    ├── application/
    │   └── use-cases/        # Application use cases
    ├── infrastructure/
    │   └── repositories/     # Prisma repository implementations
    └── presentation/
        └── actions/          # Next.js Server Actions
```

### Key Features/Modules

- **auth-rbac**: Authentication and role-based access control
- **tenants**: Multi-tenancy management
- **Administracion/**: Admin features (usuarios, roles, permisos)
- **vacancy**: Job vacancy management
- **leads**: Sales lead management (in progress)

## Multi-Tenancy & Permissions

### Tenant Context
- Sessions track `activeTenantId` for the current tenant
- `TenantProvider` provides tenant context to dashboard pages
- Users can belong to multiple tenants with different roles per tenant

### Permission System
- Permissions follow format: `resource:action` (e.g., `usuarios:crear`, `leads:acceder`)
- Route permissions configured in `src/core/shared/helpers/route-permissions.config.ts`
- `super:admin` permission grants full system access
- `PermissionGuard` component for UI-level permission checks

### Guards
- `AuthGuard`: Ensures user is authenticated
- `RouteGuard`: Validates route-level permissions
- Permission checks happen in Server Actions before business logic

## Key Patterns

### Server Actions
Server Actions in `presentation/actions/` handle:
1. Authentication check via `auth.api.getSession()`
2. Tenant context via `getCurrentTenantAction()`
3. Permission validation
4. Use case execution
5. Cache revalidation with `revalidatePath()`

### Error Handling
Uses Result pattern via `TryCatch` helper:
```typescript
import { TryCatch } from "@/core/shared/helpers/tryCatch";
const result = await TryCatch(promise);
if (!result.ok) { /* handle error */ }
```

### Path Aliases
```typescript
@/*        → ./src/*
@core/*    → ./src/core/*
@shadcn/*  → ./src/core/shared/ui/shadcn/*
@lib/*     → ./src/core/lib/*
@features/* → ./src/features/*
```

## Database

- PostgreSQL with Prisma ORM
- Prisma client generated to `src/core/generated/prisma/`
- Schema at `prisma/schema.prisma`
- Uses `@prisma/adapter-pg` for connection pooling

### Test Credentials (from seed)
- `admin@ejemplo.com` / `password123` - Super Admin
- `gerente@ejemplo.com` / `password123` - Finance Manager
- `capturador@ejemplo.com` / `password123` - Data Entry

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Auth**: Better Auth with Prisma adapter
- **Database**: PostgreSQL + Prisma 7
- **UI**: shadcn/ui + Radix UI + Tailwind CSS 4
- **State**: TanStack Query + TanStack Table
- **Forms**: TanStack Form
- **Runtime**: Bun
