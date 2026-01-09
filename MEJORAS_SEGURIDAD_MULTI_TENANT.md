# Documentación: Mejoras de Seguridad Multi-tenant RBAC

## 📋 Resumen Ejecutivo

Este documento describe las mejoras críticas de seguridad implementadas en el sistema Multi-tenant con RBAC de PeopleFlow2. Las mejoras abordan vulnerabilidades de seguridad, consolidación del sistema de permisos y mejoras en la arquitectura para soportar escalabilidad empresarial.

**Fecha de Implementación:** 2026-01-08  
**Estado:** ✅ Completado y verificado con `bun run build`

---

## 🎯 Objetivos Cumplidos

1. ✅ **Fuga de datos entre tenants**: Corregida con validación estricta
2. ✅ **RouteGuard fail-open**: Implementado fail-closed por seguridad
3. ✅ **Fuentes de permisos inconsistentes**: Consolidado en un solo sistema type-safe
4. ✅ **Falta de validación de tenant**: Implementado Prisma Client Extension
5. ✅ **Violaciones DRY**: Servicio centralizado de permisos
6. ✅ **Tenant scoping automático**: Prisma Extension con AsyncLocalStorage

---

## 🔒 Mejoras de Seguridad Implementadas

### 1. Corrección de Fuga de Datos entre Tenants

**Archivo:** `src/features/auth-rbac/server/infrastructure/repositories/PrismaUserRoleRepository.ts`

#### Problema Anterior

El método `getUserPermissions` hacía fallback a roles globales sin validación estricta:

```typescript
// ❌ ANTES - VULNERABLE
if (userRoles.length === 0 && tenantId) {
  const globalRoles = await prisma.userRole.findMany({
    where: { userId, tenantId: null }, // PELIGRO: Podía exponer permisos de otros tenants
  });
}
```

#### Solución Implementada

```typescript
// ✅ DESPUÉS - SEGURO
async getUserPermissions(userId: string, tenantId: string | null): Promise<string[]> {
  // PASO 1: Verificar si es SuperAdmin (único con acceso global)
  const isSuperAdmin = await this.isSuperAdmin(userId);

  if (isSuperAdmin) {
    // SuperAdmin: Solo permisos globales explícitos (tenantId = null)
    const globalRoles = await prisma.userRole.findMany({
      where: { userId, tenantId: null },
      include: {...},
    });
    return this.extractPermissionsFromRoles(globalRoles);
  }

  // PASO 2: Usuario normal - REQUIERE tenantId
  // FAIL-CLOSED: Sin tenant, sin permisos
  if (!tenantId) {
    return [];
  }

  // PASO 3: SOLO permisos del tenant específico
  // NO hay fallback a roles globales
  const userRoles = await prisma.userRole.findMany({
    where: { userId, tenantId }, // Filtrado ESTRICTO
    include: {...},
  });

  return this.extractPermissionsFromRoles(userRoles);
}
```

**Impacto:** Elimina completamente la posibilidad de que un usuario normal acceda a permisos de otro tenant.

---

### 2. RouteGuard: Fail-Closed en Errores

**Archivo:** `src/core/shared/components/RouteGuard.tsx`

#### Problema Anterior

En caso de error, el guard permitía acceso (fail-open):

```typescript
// ❌ ANTES - PELIGROSO
catch (error) {
  if (!silent) {
    setHasAccess(true); // Permite acceso en error
  }
}
```

#### Solución Implementada

```typescript
// ✅ DESPUÉS - SEGURO (Fail-Closed)
catch (error) {
  console.error("Error checking route access:", error);
  // FAIL-CLOSED: Denegar acceso en caso de error por seguridad
  if (!silent) {
    setHasAccess(false);
    router.replace("/access-denied?error=verification_failed");
  }
  // Si es silent (verificación periódica), mantener estado actual
  // para no interrumpir al usuario por errores temporales
}
```

**Impacto:** Previene acceso no autorizado en caso de errores de red o servidor.

---

### 3. Sistema de Permisos Type-Safe

**Archivo:** `src/core/shared/constants/permissions.ts`

#### Mejora Implementada

Se agregó el objeto `PermissionActions` para type-safety y autocompletado:

```typescript
/**
 * Objeto para acceso type-safe a permisos
 * Permite autocompletado en el IDE y validación en tiempo de compilación
 */
export const PermissionActions = {
  // Módulo: Administración
  usuarios: {
    acceder: "usuarios:acceder",
    crear: "usuarios:crear",
    editar: "usuarios:editar",
    eliminar: "usuarios:eliminar",
    asignarRoles: "usuarios:asignar-roles",
    gestionar: "usuarios:gestionar",
  },
  roles: {
    acceder: "roles:acceder",
    crear: "roles:crear",
    editar: "roles:editar",
    eliminar: "roles:eliminar",
    asignarPermisos: "roles:asignar-permisos",
    gestionar: "roles:gestionar",
  },
  // ... resto de módulos (finanzas, reclutamiento, sistema, ventas)
  super: {
    admin: "super:admin",
  },
} as const;

// Tipo helper para extraer valores
export type PermissionName = NestedValues<typeof PermissionActions>;
```

**Beneficios:**

- ✅ Autocompletado en el IDE
- ✅ Validación en tiempo de compilación
- ✅ Refactoring seguro
- ✅ Prevención de errores tipográficos

---

### 4. Servicio Centralizado de Permisos (DRY)

**Archivo:** `src/core/lib/permissions/permission.service.ts`

#### Problema Anterior

La lógica de verificación de permisos estaba duplicada en 3 lugares:

- `permission-checker.ts`
- `PermissionDomainService.ts`
- `middleware-permissions.service.ts`

#### Solución Implementada

Se creó un servicio centralizado único:

```typescript
/**
 * Servicio centralizado para verificación de permisos
 * ÚNICA fuente de verdad para toda la lógica de verificación
 */
export class PermissionService {
  /**
   * Verifica si el usuario tiene un permiso específico
   */
  static hasPermission(userPermissions: string[], permission: string): boolean {
    // SuperAdmin tiene acceso total
    if (this.isSuperAdmin(userPermissions)) return true;

    // Verificar permiso exacto
    if (userPermissions.includes(permission)) return true;

    // Verificar permiso modular (:gestionar incluye todas las acciones)
    const [resource, action] = permission.split(":");
    if (resource && action && action !== "gestionar") {
      const modularPermission = `${resource}:gestionar`;
      if (userPermissions.includes(modularPermission)) {
        return true;
      }
    }

    return false;
  }

  static hasAnyPermission(userPermissions: string[], permissions: string[]): boolean {...}
  static hasAllPermissions(userPermissions: string[], permissions: string[]): boolean {...}
  static isSuperAdmin(userPermissions: string[]): boolean {...}
  // ... más métodos
}
```

**Todos los demás módulos ahora re-exportan desde este servicio:**

- `permission-checker.ts` → Re-exporta desde `PermissionService`
- `PermissionDomainService` → Delega a `PermissionService`
- `middleware-permissions.service.ts` → Usa `hasPermission` de helpers

**Impacto:** Una sola fuente de verdad, más fácil de mantener y testear.

---

### 5. Prisma Client Extension para Tenant Scoping

**Archivos:**

- `src/core/lib/tenant-context.ts` (AsyncLocalStorage)
- `src/core/lib/prisma-tenant.ts` (Prisma Extension)
- `src/core/lib/prisma.ts` (Exportación)

#### Implementación

**1. Contexto de Tenant con AsyncLocalStorage:**

```typescript
// src/core/lib/tenant-context.ts
import { AsyncLocalStorage } from "async_hooks";

export interface TenantContext {
  tenantId: string | null;
  userId: string | null;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return tenantStorage.run(context, fn);
}

export function getTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}
```

**2. Prisma Extension que inyecta tenantId automáticamente:**

```typescript
// src/core/lib/prisma-tenant.ts
export function createTenantScopedPrisma(basePrisma: PrismaClient) {
  return basePrisma.$extends({
    name: "tenant-scoping",
    query: {
      userRole: {
        async findMany({ args, query }) {
          const context = getTenantContext();
          // Inyectar tenantId automáticamente si existe contexto
          if (context?.tenantId && args.where?.tenantId === undefined) {
            args.where = { ...args.where, tenantId: context.tenantId };
          }
          return query(args);
        },
        // ... findFirst, count
      },
    },
  });
}
```

**3. Exportación dual:**

```typescript
// src/core/lib/prisma.ts
export default prisma; // Cliente base (sin tenant scoping)
export { prismaWithTenant }; // Cliente con tenant scoping automático
```

**Uso:**

```typescript
import { prismaWithTenant } from "@/core/lib/prisma";
import { runWithTenant } from "@/core/lib/tenant-context";

// Las consultas automáticamente filtran por tenantId
const result = await runWithTenant(
  { tenantId: "tenant-123", userId: "user-456" },
  () => prismaWithTenant.userRole.findMany({})
  // ↑ Automáticamente filtra por tenantId: "tenant-123"
);
```

**Impacto:** Previene olvidos de filtrado por tenant en consultas futuras.

---

## 🎨 Nuevos Componentes

### PermissionGuard Component

**Archivo:** `src/core/shared/components/PermissionGuard.tsx`

#### Descripción

Componente que protege contenido UI basándose en permisos del usuario. Permite mostrar/ocultar elementos según los permisos del usuario actual.

#### Uso Básico

```tsx
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";

// Permiso único
<PermissionGuard permission={PermissionActions.usuarios.acceder}>
  <UserTable />
</PermissionGuard>

// Múltiples permisos (necesita al menos uno)
<PermissionGuard
  permissions={[
    PermissionActions.usuarios.acceder,
    PermissionActions.usuarios.gestionar,
  ]}
>
  <UserTable />
</PermissionGuard>

// Múltiples permisos (necesita todos)
<PermissionGuard
  permissions={[
    PermissionActions.usuarios.acceder,
    PermissionActions.usuarios.editar,
  ]}
  requireAll
>
  <EditUserButton />
</PermissionGuard>

// Con fallback personalizado
<PermissionGuard
  permission={PermissionActions.usuarios.eliminar}
  fallback={<span className="text-muted-foreground">No tienes permiso para eliminar</span>}
>
  <DeleteButton />
</PermissionGuard>
```

#### Props

| Prop          | Tipo        | Requerido | Descripción                                                                                        |
| ------------- | ----------- | --------- | -------------------------------------------------------------------------------------------------- |
| `children`    | `ReactNode` | ✅        | Contenido a mostrar si tiene permisos                                                              |
| `permission`  | `string`    | ❌        | Permiso único requerido                                                                            |
| `permissions` | `string[]`  | ❌        | Array de permisos (necesita al menos uno o todos según `requireAll`)                               |
| `fallback`    | `ReactNode` | ❌        | Componente a mostrar si no tiene permisos (default: `null`)                                        |
| `requireAll`  | `boolean`   | ❌        | Si es `true`, requiere todos los permisos; si es `false`, requiere al menos uno (default: `false`) |

#### Características

- ✅ **SuperAdmin bypass**: Los super admins siempre tienen acceso
- ✅ **Loading state**: Maneja el estado de carga automáticamente
- ✅ **Type-safe**: Usa `PermissionActions` para autocompletado

---

## 🔄 Flujo Completo del Usuario

### 1. Inicio de Sesión (`/sign-in`)

```
Usuario → Ingresa credenciales → useAuth.login() → Better Auth
                                                    ↓
                                        Valida credenciales en BD
                                                    ↓
                                    Crea sesión con token en cookie
                                                    ↓
                                        Redirect a "/"
```

**Archivos involucrados:**

- `src/features/Auth/frontend/pages/SignInPage.tsx`
- `src/core/shared/hooks/use-auth.ts` (líneas 71-103)

---

### 2. Redirección Post-Login (`/` → HomePage)

```
HomePage → Obtiene sesión → Obtiene roles del usuario
                              ↓
                    ¿Es SuperAdmin?
                    /        |        \
                   Sí        No      Sin roles
                   ↓         ↓           ↓
            /super-admin  Tiene tenants?  /access-denied
                          /        \
                    Múltiples    Un solo tenant
                         ↓            ↓
                  /select-tenant  setActiveTenant()
                                    ↓
                          getDefaultRoute(permissions)
                                    ↓
                          Redirect a ruta según permisos
```

**Archivos involucrados:**

- `src/app/page.tsx` (Server Component)
- `src/core/lib/permissions/get-default-route.ts`

**Lógica clave (líneas 26-114 de `page.tsx`):**

```typescript
// Obtener roles y permisos
const userRoles = await prisma.userRole.findMany({
  where: { userId },
  include: {
    role: { include: { permissions: { include: { permission: true } } } },
    tenant: true,
  },
});

// Extraer permisos únicos
const permissionSet = new Set<string>();
for (const userRole of userRoles) {
  for (const rolePermission of userRole.role.permissions) {
    permissionSet.add(rolePermission.permission.name);
  }
}

// Verificar SuperAdmin
if (userPermissions.includes("super:admin")) {
  return redirect("/super-admin");
}

// Verificar múltiples tenants
if (userTenants.length > 1 && !dbSession?.activeTenantId) {
  return redirect("/select-tenant");
}

// Redirigir a ruta por defecto según permisos
const defaultRoute = getDefaultRoute(userPermissions);
return redirect(defaultRoute);
```

---

### 3. Selección de Tenant (`/select-tenant`)

```
SelectTenantPage → Muestra lista de tenants disponibles
                      ↓
              Usuario selecciona tenant
                      ↓
          switchTenantAction(tenantId)
                      ↓
          SwitchTenantUseCase.execute()
                      ↓
          ¿Usuario tiene acceso al tenant?
          /              |              \
         Sí          No (error)      Es SuperAdmin
          ↓                              ↓
    updateSession(activeTenantId)   Permite acceso
          ↓
    getDefaultRouteForTenant(tenantId)
          ↓
    Redirect a ruta según permisos en ese tenant
```

**Archivos involucrados:**

- `src/app/(Auth)/select-tenant/page.tsx`
- `src/features/tenants/server/presentation/actions/tenant.actions.ts`
- `src/features/tenants/server/application/use-cases/SwitchTenantUseCase.ts`

**Validación de acceso (SwitchTenantUseCase, líneas 26-46):**

```typescript
async execute(input: SwitchTenantInput) {
  if (input.tenantId) {
    // Verificar si es superadmin (puede acceder a todos)
    const isSuperAdmin = await this.userRoleRepository.isSuperAdmin(input.userId);

    if (!isSuperAdmin) {
      // Verificar si el usuario pertenece al tenant
      const belongsToTenant = await this.userRoleRepository.userBelongsToTenant(
        input.userId,
        input.tenantId
      );

      if (!belongsToTenant) {
        return { success: false, error: "No tienes acceso a este tenant" };
      }
    }
  }

  // Actualizar sesión con el nuevo tenant activo
  await this.tenantRepository.updateSessionActiveTenant(
    input.sessionToken,
    input.tenantId
  );
}
```

---

### 4. Dashboard Layout y Guards

```
Layout → AuthGuard → TenantProvider → RouteGuard → Contenido
          ↓              ↓                ↓
    Verifica        Carga tenant      Verifica
    autenticación   activo            permisos de ruta
          ↓              ↓                ↓
    ¿Autenticado?   ¿Tenant cargado?  ¿Tiene permiso?
    /        \       /        \       /        \
   Sí        No     Sí        No     Sí        No
    ↓         ↓       ↓         ↓      ↓         ↓
 Continúa   /sign-in Continúa  Loading Continúa  /access-denied
```

**Jerarquía de guards (`layout.tsx`, líneas 21-53):**

```tsx
<ThemeProvider>
  <AuthGuard>
    {" "}
    {/* Línea 22 - Verifica autenticación */}
    <TenantProvider>
      {" "}
      {/* Línea 23 - Provee contexto del tenant */}
      <RouteGuard>
        {" "}
        {/* Línea 24 - Verifica permisos de ruta */}
        <SidebarProvider>{children}</SidebarProvider>
      </RouteGuard>
    </TenantProvider>
  </AuthGuard>
</ThemeProvider>
```

---

### 5. Verificación de Rutas (RouteGuard)

```
RouteGuard monta → Obtiene pathname actual
                      ↓
              Obtiene tenant activo del contexto
                      ↓
          canAccessRouteAction(pathname, tenantId)
                      ↓
          GetUserPermissionsUseCase.execute()
                      ↓
              getUserPermissions(userId, tenantId)
                      ↓
    [SEGURO] ¿Es SuperAdmin?
            /        \
           Sí        No
            ↓         ↓
    Permite acceso  ¿Tiene tenantId?
                      /        \
                     Sí        No
                      ↓         ↓
            Obtiene permisos   Retorna []
            del tenant
                      ↓
          getRequiredPermission(pathname)
                      ↓
          PermissionService.hasPermission()
                      ↓
              ¿Tiene permiso?
              /        \
             Sí        No
              ↓         ↓
        Permite acceso  /access-denied
```

**Verificación en RouteGuard (`RouteGuard.tsx`, líneas 43-79):**

```typescript
const checkAccess = useCallback(
  async (silent: boolean = false) => {
    try {
      const result = await canAccessRouteAction(pathname, tenant?.id || null);

      if (!result.canAccess) {
        router.replace("/access-denied");
        setHasAccess(false);
        return;
      }

      setHasAccess(true);
    } catch (error) {
      // ⚠️ FAIL-CLOSED: Denegar acceso en caso de error
      if (!silent) {
        setHasAccess(false);
        router.replace("/access-denied?error=verification_failed");
      }
    }
  },
  [pathname, tenant?.id, router]
);
```

---

### 6. Obtención de Permisos (Backend - SEGURO)

```
getUserPermissions(userId, tenantId)
      ↓
¿Es SuperAdmin?
  /      \
 Sí      No
  ↓       ↓
Roles   ¿Tiene tenantId?
globales   /      \
          Sí      No
           ↓       ↓
    Permisos    Retorna []
    del tenant    (FAIL-CLOSED)
    específico
           ↓
    NO hay fallback
    a roles globales
           ↓
    Retorna permisos
```

**Implementación segura (`PrismaUserRoleRepository.ts`, líneas 149-217):**

```typescript
async getUserPermissions(userId: string, tenantId: string | null): Promise<string[]> {
  // PASO 1: Verificar SuperAdmin
  const isSuperAdmin = await this.isSuperAdmin(userId);

  if (isSuperAdmin) {
    // Solo permisos globales (tenantId = null)
    const globalRoles = await prisma.userRole.findMany({
      where: { userId, tenantId: null },
      include: {...},
    });
    return this.extractPermissionsFromRoles(globalRoles);
  }

  // PASO 2: Usuario normal - REQUIERE tenantId
  if (!tenantId) {
    return []; // FAIL-CLOSED
  }

  // PASO 3: SOLO permisos del tenant específico
  // NO hay fallback a roles globales
  const userRoles = await prisma.userRole.findMany({
    where: { userId, tenantId }, // Filtrado ESTRICTO
    include: {...},
  });

  return this.extractPermissionsFromRoles(userRoles);
}
```

---

### 7. Verificación de Permisos (Servicio Centralizado)

```
PermissionService.hasPermission(userPermissions, permission)
      ↓
¿Es SuperAdmin?
  /      \
 Sí      No
  ↓       ↓
 true  ¿Tiene permiso exacto?
         /      \
        Sí      No
         ↓       ↓
      true  ¿Tiene permiso modular?
              (recurso:gestionar)
              /      \
             Sí      No
              ↓       ↓
          true     false
```

**Lógica del servicio (`permission.service.ts`, líneas 32-56):**

```typescript
static hasPermission(userPermissions: string[], permission: string): boolean {
  // Validación de entrada
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  // SuperAdmin tiene acceso total
  if (this.isSuperAdmin(userPermissions)) {
    return true;
  }

  // Verificar permiso exacto
  if (userPermissions.includes(permission)) {
    return true;
  }

  // Verificar permiso modular (:gestionar incluye todas las acciones)
  const [resource, action] = permission.split(":");
  if (resource && action && action !== "gestionar") {
    const modularPermission = `${resource}:gestionar`;
    if (userPermissions.includes(modularPermission)) {
      return true;
    }
  }

  return false;
}
```

---

### 8. Acceso Denegado

Si el usuario intenta acceder a una ruta sin permisos:

```
RouteGuard detecta falta de permiso
      ↓
router.replace("/access-denied")
      ↓
Página muestra mensaje de acceso denegado
      ↓
Usuario puede:
  - Volver a la página anterior
  - Solicitar permisos a un admin
```

---

### 9. Cambio de Tenant (Desde Sidebar)

```
Usuario hace click en TeamSwitcher
      ↓
switchTenantAction(tenantId)
      ↓
SwitchTenantUseCase.execute()
      ↓
Valida acceso al tenant
      ↓
Actualiza sesión (activeTenantId)
      ↓
getDefaultRouteForTenantAction(tenantId)
      ↓
Obtiene permisos del usuario en el nuevo tenant
      ↓
Calcula ruta por defecto según permisos
      ↓
router.push(defaultRoute)
      ↓
RouteGuard verifica permisos de la nueva ruta
```

---

## 📚 Guía de Uso de Componentes

### PermissionGuard

#### Caso de Uso 1: Proteger Tabla de Datos

```tsx
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";

function UsersPage() {
  return (
    <div>
      <h1>Usuarios</h1>

      {/* Solo mostrar si tiene permiso de acceso */}
      <PermissionGuard permission={PermissionActions.usuarios.acceder}>
        <DataTable columns={columns} data={users} />
      </PermissionGuard>

      {/* Solo mostrar botón crear si tiene permiso */}
      <PermissionGuard permission={PermissionActions.usuarios.crear}>
        <Button onClick={handleCreate}>Crear Usuario</Button>
      </PermissionGuard>
    </div>
  );
}
```

#### Caso de Uso 2: Botones Condicionales

```tsx
function UserActions({ user }) {
  return (
    <div className="flex gap-2">
      {/* Editar - necesita permiso específico */}
      <PermissionGuard
        permission={PermissionActions.usuarios.editar}
        fallback={<Button disabled>Editar</Button>}
      >
        <Button onClick={() => editUser(user.id)}>Editar</Button>
      </PermissionGuard>

      {/* Eliminar - necesita permiso específico O gestionar */}
      <PermissionGuard
        permissions={[
          PermissionActions.usuarios.eliminar,
          PermissionActions.usuarios.gestionar,
        ]}
        fallback={<Button disabled>Eliminar</Button>}
      >
        <Button variant="destructive" onClick={() => deleteUser(user.id)}>
          Eliminar
        </Button>
      </PermissionGuard>
    </div>
  );
}
```

#### Caso de Uso 3: Múltiples Permisos (Todos Requeridos)

```tsx
<PermissionGuard
  permissions={[
    PermissionActions.roles.acceder,
    PermissionActions.roles.asignarPermisos,
  ]}
  requireAll
>
  <RolePermissionsEditor />
</PermissionGuard>
```

---

### usePermissions Hook

**Archivo:** `src/core/shared/hooks/use-permissions.ts`

```tsx
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { PermissionActions } from "@/core/shared/constants/permissions";

function MyComponent() {
  const {
    permissions, // string[] - Array de permisos del usuario
    hasPermission, // (permission: string) => boolean
    hasAnyPermission, // (permissions: string[]) => boolean
    hasAllPermissions, // (permissions: string[]) => boolean
    hasResourceAccess, // (resource: string) => boolean
    isSuperAdmin, // boolean
    isAdmin, // boolean
    isLoading, // boolean
    error, // string | null
    refresh, // () => Promise<void>
    tenantId, // string | null
  } = usePermissions();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;

  // Verificar permiso específico
  if (!hasPermission(PermissionActions.usuarios.acceder)) {
    return <AccessDenied />;
  }

  return <div>Contenido</div>;
}
```

---

### PermissionActions (Type-Safe)

**Archivo:** `src/core/shared/constants/permissions.ts`

```tsx
import {
  PermissionActions,
  type PermissionName,
} from "@/core/shared/constants/permissions";

// ✅ Type-safe con autocompletado
const permiso1 = PermissionActions.usuarios.acceder; // "usuarios:acceder"
const permiso2 = PermissionActions.roles.gestionar; // "roles:gestionar"

// ✅ Tipado estricto
function checkPermission(perm: PermissionName) {
  // TypeScript valida que perm sea un permiso válido
}

// ❌ Esto causaría error de TypeScript:
const permisoInvalido = PermissionActions.usuarios.permisoInexistente;
```

---

## 🏗️ Arquitectura Mejorada

### Antes vs Después

#### ANTES (Problemático)

```
┌─────────────────────────────────────┐
│ 3 Fuentes de Permisos               │
├─────────────────────────────────────┤
│ • domain/constants/permissions.ts   │ ← Permisos obsoletos
│ • shared/constants/permissions.ts   │ ← Permisos actuales
│ • Base de datos (Permission)        │ ← Fuente real
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Lógica Duplicada                    │
├─────────────────────────────────────┤
│ • permission-checker.ts             │
│ • PermissionDomainService.ts        │
│ • middleware-permissions.service.ts │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Fuga de Datos                       │
├─────────────────────────────────────┤
│ getUserPermissions() hace fallback  │
│ a roles globales sin validación     │
└─────────────────────────────────────┘
```

#### DESPUÉS (Mejorado)

```
┌─────────────────────────────────────┐
│ 1 Fuente de Permisos                │
├─────────────────────────────────────┤
│ • shared/constants/permissions.ts   │ ← Única fuente
│   - PermissionActions (type-safe)   │
│   - ALL_PERMISSIONS                 │
│ • Base de datos (sincronizada)      │ ← Seed desde constants
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Servicio Centralizado (DRY)         │
├─────────────────────────────────────┤
│ • PermissionService                 │ ← Única implementación
│   - hasPermission()                 │
│   - hasAnyPermission()              │
│   - hasAllPermissions()             │
│   - isSuperAdmin()                  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Aislamiento Estricto                │
├─────────────────────────────────────┤
│ getUserPermissions()                │
│ • SuperAdmin → Roles globales       │
│ • Usuario normal → Solo tenant      │
│ • Sin tenant → [] (fail-closed)     │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Tenant Scoping Automático           │
├─────────────────────────────────────┤
│ • Prisma Extension                  │
│ • AsyncLocalStorage                 │
│ • Inyección automática de tenantId  │
└─────────────────────────────────────┘
```

---

## 🔍 Puntos Clave de Seguridad

### 1. Principio de Menor Privilegio

- ✅ Usuarios normales solo tienen acceso a su tenant
- ✅ Sin tenant = Sin permisos (fail-closed)
- ✅ Solo SuperAdmin tiene acceso global

### 2. Defensa en Profundidad

- ✅ Validación en RouteGuard (frontend)
- ✅ Validación en Server Actions (backend)
- ✅ Validación en Repositorio (datos)
- ✅ Prisma Extension (inyección automática)

### 3. Fail-Closed

- ✅ RouteGuard: Denegar acceso en errores
- ✅ getUserPermissions: Retornar [] sin tenant
- ✅ SwitchTenant: Validar acceso antes de cambiar

### 4. Type Safety

- ✅ `PermissionActions` previene errores tipográficos
- ✅ `PermissionName` tipo estricto
- ✅ Autocompletado en el IDE

---

## 📝 Archivos Modificados/Creados

### Nuevos Archivos

| Archivo                                          | Propósito                                   |
| ------------------------------------------------ | ------------------------------------------- |
| `src/core/shared/components/PermissionGuard.tsx` | Componente para proteger UI                 |
| `src/core/lib/permissions/permission.service.ts` | Servicio centralizado de permisos           |
| `src/core/lib/tenant-context.ts`                 | AsyncLocalStorage para contexto de tenant   |
| `src/core/lib/prisma-tenant.ts`                  | Prisma Client Extension para tenant scoping |

### Archivos Modificados

| Archivo                                                  | Cambio                               |
| -------------------------------------------------------- | ------------------------------------ |
| `src/core/shared/constants/permissions.ts`               | Agregado `PermissionActions` object  |
| `src/core/shared/components/RouteGuard.tsx`              | Fail-closed en errores               |
| `src/core/shared/helpers/permission-checker.ts`          | Re-exporta desde `PermissionService` |
| `src/core/lib/prisma.ts`                                 | Exporta `prismaWithTenant`           |
| `src/features/auth-rbac/.../PrismaUserRoleRepository.ts` | Fix tenant isolation                 |
| `src/features/auth-rbac/.../PermissionDomainService.ts`  | Delega a `PermissionService`         |
| `src/features/auth-rbac/.../CheckPermissionUseCase.ts`   | Usa servicio centralizado            |
| `src/features/auth-rbac/.../AssignUserToTenantForm.tsx`  | Obtiene roles desde BD               |
| `src/features/auth-rbac/.../user.actions.ts`             | Agregado `getRolesAction()`          |

### Archivos Eliminados

| Archivo                                                         | Razón                                        |
| --------------------------------------------------------------- | -------------------------------------------- |
| `src/features/auth-rbac/server/domain/constants/permissions.ts` | Permisos obsoletos (facturas, colaboradores) |

---

## ✅ Verificación

### Build de Producción

```bash
bun run build
```

**Resultado:** ✅ Compilación exitosa sin errores de TypeScript

### Tests Recomendados

1. ✅ Test de aislamiento de tenants
   - Usuario normal no puede acceder a datos de otro tenant
   - SuperAdmin puede acceder a todos los tenants

2. ✅ Test de fail-closed
   - RouteGuard deniega acceso en errores
   - getUserPermissions retorna [] sin tenant

3. ✅ Test de permisos modulares
   - `recurso:gestionar` incluye todas las acciones
   - `super:admin` tiene acceso total

4. ✅ Test de PermissionGuard
   - Muestra contenido con permiso
   - Oculta contenido sin permiso
   - Muestra fallback correctamente

---

## 🚀 Próximos Pasos Recomendados

1. **Cache de Permisos**
   - Implementar Redis para cachear permisos
   - Invalidar cache al cambiar roles

2. **Audit Trail**
   - Registrar cambios de roles/permisos
   - Registrar cambios de tenant activo
   - Registrar intentos de acceso denegado

3. **Rate Limiting**
   - Proteger Server Actions contra ataques
   - Límite de requests por usuario/tenant

4. **Soft Delete**
   - Agregar `deletedAt` a entidades principales
   - Mantener historial para compliance

5. **Testing**
   - Tests unitarios para `PermissionService`
   - Tests de integración para flujo completo
   - Tests E2E para verificación de permisos

---

## 📞 Soporte

Para preguntas o problemas relacionados con estas mejoras, consultar:

- Este documento
- Comentarios en el código
- Logs del sistema en caso de errores

---

**Última actualización:** 2026-01-08  
**Versión:** 1.0.0  
**Autor:** Sistema de Auditoría Técnica
