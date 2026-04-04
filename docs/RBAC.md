# Sistema RBAC (Role-Based Access Control)

Sistema de control de acceso basado en roles implementado con arquitectura DDD (Domain-Driven Design), multi-tenant y con soporte para permisos granulares y modulares.

---

## Tabla de Contenidos

- [Resumen del Modelo](#resumen-del-modelo)
- [Modelo de Datos (Prisma)](#modelo-de-datos-prisma)
- [Arquitectura DDD](#arquitectura-ddd)
- [Sistema de Permisos](#sistema-de-permisos)
- [Flujo de Verificacion](#flujo-de-verificacion)
- [Capa de Presentacion (Server Actions)](#capa-de-presentacion-server-actions)
- [Capa Frontend](#capa-frontend)
- [Proteccion de Rutas](#proteccion-de-rutas)
- [Sidebar Dinamico](#sidebar-dinamico)
- [Guia de Uso Rapido](#guia-de-uso-rapido)
- [Archivos Clave](#archivos-clave)

---

## Resumen del Modelo

El sistema RBAC sigue el modelo clasico **Usuario → Rol → Permiso**, con un agregado fundamental: **todo esta scoped por Tenant**.

```
Usuario (User)
  └─ UserRole (asignacion)
       ├─ Role (rol)
       │    └─ RolePermission (asignacion)
       │         └─ Permission (permiso)
       └─ Tenant (scope)
```

**Conceptos clave:**

| Concepto        | Descripcion                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| **User**        | Usuario autenticado via Better Auth                                         |
| **Role**        | Rol con nombre, scoped a un Tenant (`tenantId`) o global (`tenantId=null`)  |
| **UserRole**    | Asignacion de un usuario a un rol dentro de un tenant especifico            |
| **Permission**  | Permiso individual con formato `recurso:accion`                             |
| **RolePermission** | Tabla pivot que conecta roles con permisos                               |

---

## Modelo de Datos (Prisma)

### Role

```prisma
model Role {
  id          String           @id @default(uuid())
  name        String
  tenantId    String?          // null = rol global (ej: superadmin)
  tenant      Tenant?          @relation(...)
  users       UserRole[]
  permissions RolePermission[]

  @@unique([name, tenantId])   // Un rol con el mismo nombre por tenant
}
```

- Los roles son **por tenant**: cada tenant puede tener sus propios roles con los mismos nombres (ej: "gerente" en Tenant A y "gerente" en Tenant B son roles diferentes con potencialmente distintos permisos).
- Un rol con `tenantId = null` es **global** (usado para SuperAdmin).

### UserRole

```prisma
model UserRole {
  id        String   @id @default(uuid())
  userId    String
  roleId    String
  tenantId  String?  // null = asignacion global

  @@unique([userId, tenantId, roleId])  // Un usuario no puede tener el mismo rol dos veces en el mismo tenant
  @@index([userId, tenantId])           // Optimiza getUserPermissions()
}
```

- Conecta un usuario con un rol **dentro de un tenant especifico**.
- Un usuario puede tener diferentes roles en diferentes tenants.
- `tenantId = null` indica un rol global (SuperAdmin).

### Permission

```prisma
model Permission {
  id          String           @id @default(uuid())
  name        String           @unique    // Formato: "recurso:accion"
  resource    String                       // Ej: "vacantes", "facturas"
  action      String                       // Ej: "acceder", "crear", "gestionar"
  description String?
  roles       RolePermission[]
}
```

### RolePermission

```prisma
model RolePermission {
  id           String @id @default(uuid())
  roleId       String
  permissionId String

  @@unique([roleId, permissionId])  // Un permiso no se puede asignar dos veces al mismo rol
}
```

---

## Arquitectura DDD

El feature `auth-rbac` sigue la estructura DDD del proyecto:

```
src/features/auth-rbac/
├── frontend/
│   ├── components/
│   │   ├── PermissionGate.tsx       # Componente declarativo para proteger UI
│   │   ├── CreateUserForm.tsx
│   │   └── AssignUserToTenantForm.tsx
│   ├── hooks/
│   │   └── usePermissions.ts        # Re-export del hook centralizado
│   ├── pages/
│   │   └── AdminPage.tsx
│   ├── types/
│   │   └── index.ts                 # Tipos compartidos frontend/backend
│   └── schemas/
│       ├── permission.schema.ts     # Validacion Zod
│       └── user.schema.ts
└── server/
    ├── domain/
    │   ├── entities/
    │   │   ├── Permission.ts        # Entidad con props privadas + getters
    │   │   ├── Role.ts              # Incluye isSuperAdmin()
    │   │   └── UserRole.ts          # Incluye isGlobal()
    │   ├── interfaces/
    │   │   ├── IPermissionRepository.ts
    │   │   ├── IRoleRepository.ts
    │   │   └── IUserRoleRepository.ts
    │   └── services/
    │       └── PermissionDomainService.ts  # Delega al PermissionService centralizado
    ├── application/
    │   └── use-cases/
    │       ├── CheckAnyPermissionUseCase.ts
    │       ├── CheckPermissionUseCase.ts
    │       ├── GetUserPermissionsUseCase.ts
    │       ├── IsSuperAdminUseCase.ts
    │       ├── GetTenantUsersUseCase.ts
    │       ├── CreateUserUseCase.ts
    │       └── AssignUserToTenantUseCase.ts
    ├── infrastructure/
    │   └── repositories/
    │       ├── PrismaRoleRepository.ts
    │       └── PrismaUserRoleRepository.ts  # Singleton exportado
    └── presentation/
        └── actions/
            ├── permission.actions.ts  # Server Actions de permisos
            └── user.actions.ts        # Server Actions de usuarios
```

---

## Sistema de Permisos

### Formato de Permisos

Todos los permisos siguen el formato **`recurso:accion`**:

```
vacantes:acceder
vacantes:crear
vacantes:editar
vacantes:eliminar
vacantes:gestionar    ← Permiso modular (incluye TODAS las acciones del recurso)
```

### Permiso Especial: `super:admin`

El permiso `super:admin` otorga **acceso total** al sistema. Funciona como un bypass: cualquier verificacion de permisos retorna `true` si el usuario tiene `super:admin`.

### Permisos Modulares (`:gestionar`)

Cada recurso tiene un permiso `:gestionar` que actua como **wildcard del recurso**. Si un usuario tiene `vacantes:gestionar`, automaticamente tiene acceso a `vacantes:acceder`, `vacantes:crear`, `vacantes:editar`, `vacantes:eliminar`, y todas las demas acciones de ese recurso.

### Modulos y Permisos Disponibles

Los permisos estan organizados en 5 modulos:

| Modulo            | Recursos                                                  |
| ----------------- | --------------------------------------------------------- |
| **Administracion**| `usuarios`, `roles`                                       |
| **Finanzas**      | `ingresos`, `egresos`, `clientes`, `facturas`             |
| **Reclutamiento** | `vacantes`, `candidatos`, `reportes-reclutamiento`        |
| **Sistema**       | `configuracion`, `actividad`                              |
| **Ventas**        | `leads`, `reportes-ventas`                                |

Cada recurso tiene como minimo: `acceder`, `crear`, `editar`, `eliminar`, `gestionar`.

Algunos recursos tienen acciones especificas adicionales. Por ejemplo, `vacantes` incluye:
- `vacantes:validar-terna` - Validar terna de candidatos (requiere Manager/Lider)
- `vacantes:actualizar-estado` - Cambiar estado de la vacante
- `vacantes:revisar-archivos` - Validar/rechazar JD y Perfiles Muestra
- `vacantes:subir-archivos` - Subir JD, Perfiles Muestra y CVs
- `vacantes:validar-checklist` / `vacantes:rechazar-checklist`
- `vacantes:modificar-fecha-asignacion` / `vacantes:modificar-fecha-tentativa-entrega`
- `vacantes:reasignar` - Reasignar reclutador

### Constante Type-Safe: `PermissionActions`

Para usar permisos con autocompletado del IDE:

```typescript
import { PermissionActions } from "@/core/shared/constants/permissions";

// En vez de strings sueltos:
// ❌ "vacantes:crear"
// ✅ PermissionActions.vacantes.crear
```

Ubicacion: `src/core/shared/constants/permissions.ts`

---

## Flujo de Verificacion

### Cadena de Verificacion (Orden de Prioridad)

Cuando se verifica si un usuario tiene un permiso, el `PermissionService` sigue este orden:

```
1. ¿Es SuperAdmin? (tiene permiso "super:admin")
   └─ SI → Acceso concedido (bypass total)
   └─ NO → Continuar

2. ¿Tiene el permiso exacto?
   └─ SI → Acceso concedido
   └─ NO → Continuar

3. ¿Tiene el permiso modular del recurso? (":gestionar")
   └─ SI → Acceso concedido (ej: "vacantes:gestionar" cubre "vacantes:crear")
   └─ NO → Acceso denegado
```

### Resolucion de Permisos por Tenant

La query de obtencion de permisos (`getUserPermissions`) implementa aislamiento estricto:

```
1. Una sola query obtiene roles globales (tenantId=null) Y del tenant actual

2. ¿El usuario tiene un rol global con "super:admin"?
   └─ SI → Retorna permisos de los roles GLOBALES
   └─ NO → Continuar

3. ¿Se proporciono un tenantId?
   └─ NO → Retorna array vacio (FAIL-CLOSED)
   └─ SI → Retorna SOLO permisos del tenant especifico
```

**Principio FAIL-CLOSED**: si no hay tenant, no hay permisos. Esto previene escalacion accidental de privilegios.

### PermissionService (Fuente Unica de Verdad)

Ubicacion: `src/core/lib/permissions/permission.service.ts`

```typescript
class PermissionService {
  // Verificar un permiso individual
  static hasPermission(userPermissions: string[], permission: string): boolean;

  // Verificar al menos uno de varios permisos
  static hasAnyPermission(userPermissions: string[], permissions: string[]): boolean;

  // Verificar que tenga TODOS los permisos
  static hasAllPermissions(userPermissions: string[], permissions: string[]): boolean;

  // Verificar si es SuperAdmin
  static isSuperAdmin(userPermissions: string[]): boolean;

  // Verificar acceso a un recurso (cualquier accion)
  static hasResourceAccess(userPermissions: string[], resource: string): boolean;

  // Parsear "recurso:accion" en objeto
  static parsePermission(permission: string): { resource: string; action: string } | null;

  // Listar recursos accesibles
  static getAccessibleResources(userPermissions: string[]): string[];
}
```

Todo el codigo del proyecto DEBE usar este servicio para verificar permisos. Las demas utilidades (`permission-checker.ts`, `PermissionDomainService.ts`) son wrappers que delegan a este servicio.

---

## Capa de Presentacion (Server Actions)

### Verificar Permisos en Server Actions

Patron estandar para proteger una server action:

```typescript
"use server";

import { CheckAnyPermissonUseCase } from "@auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

export async function myProtectedAction(input: MyInput) {
  // 1. Verificar sesion
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "No autenticado" };

  // 2. Obtener tenant activo
  const tenantId = await getActiveTenantId();
  if (!tenantId) return { error: "No hay tenant activo" };

  // 3. Verificar permiso
  const { hasAnyPermission } = await new CheckAnyPermissonUseCase().execute({
    userId: session.user.id,
    permissions: [PermissionActions.vacantes.crear],
    tenantId,
  });
  if (!hasAnyPermission) return { error: "Sin permisos" };

  // 4. Ejecutar logica de negocio...
}
```

### Server Actions Disponibles

**`permission.actions.ts`**:
- `checkPermissionAction(permission, tenantId)` - Verifica un permiso especifico
- `getUserPermissionsAction(tenantId)` - Obtiene todos los permisos del usuario
- `getDefaultRouteForTenantAction(tenantId)` - Calcula la ruta por defecto segun permisos
- `canAccessRouteAction(pathname, tenantId)` - Verifica acceso a una ruta

**`user.actions.ts`** (solo SuperAdmin):
- `createUserAction(formData)` - Crear usuario nuevo
- `assignUserToTenantAction(formData)` - Asignar usuario a tenant con rol
- `getTenantUsersAction(tenantId)` - Listar usuarios de un tenant
- `isSuperAdminAction()` - Verificar si el usuario actual es SuperAdmin
- `getRolesAction()` - Listar roles disponibles

---

## Capa Frontend

### PermissionProvider (Context)

Los permisos se cargan una vez al montar la app y se distribuyen via React Context.

Ubicacion: `src/core/shared/context/PermissionContext.tsx`

```
App
└─ TenantProvider         ← Provee el tenant activo
   └─ PermissionProvider  ← Carga permisos del usuario en el tenant activo
      └─ {children}       ← Toda la app tiene acceso a los permisos
```

Al cambiar de tenant, los permisos se recargan automaticamente.

### Hook `usePermissions()`

Hook centralizado para acceder a los permisos desde cualquier componente:

```typescript
import { usePermissions } from "@core/shared/hooks/use-permissions";

function MyComponent() {
  const {
    permissions,        // string[] - Array de permisos del usuario
    hasPermission,      // (permission: string) => boolean
    hasAnyPermission,   // (permissions: string[]) => boolean
    hasAllPermissions,  // (permissions: string[]) => boolean
    hasResourceAccess,  // (resource: string) => boolean
    isSuperAdmin,       // boolean
    isAdmin,            // boolean
    isLoading,          // boolean
    error,              // string | null
    refresh,            // () => Promise<void>
    tenantId,           // string | null
  } = usePermissions();
}
```

### Componente `<PermissionGate>`

Componente declarativo para mostrar/ocultar UI segun permisos:

```tsx
import { PermissionGate, SuperAdminGate, AdminGate } from "@auth-rbac/frontend/components/PermissionGate";

// Permiso unico
<PermissionGate permission="facturas:crear">
  <Button>Crear Factura</Button>
</PermissionGate>

// Cualquier permiso del array (OR)
<PermissionGate anyPermission={["facturas:crear", "facturas:editar"]}>
  <Button>Gestionar Facturas</Button>
</PermissionGate>

// Todos los permisos del array (AND)
<PermissionGate allPermissions={["facturas:crear", "facturas:editar"]}>
  <Button>Control Total de Facturas</Button>
</PermissionGate>

// Con fallback y loading
<PermissionGate
  permission="facturas:crear"
  fallback={<p>No tienes acceso</p>}
  loading={<Skeleton />}
>
  <CreateInvoiceForm />
</PermissionGate>

// Solo SuperAdmin
<SuperAdminGate>
  <AdminDashboard />
</SuperAdminGate>

// Solo Admin (tiene acceso a usuarios:*)
<AdminGate>
  <UserManagement />
</AdminGate>
```

---

## Proteccion de Rutas

### Mapa de Rutas a Permisos

Cada ruta del sistema tiene un permiso requerido definido en `route-permissions.config.ts`:

```typescript
const ROUTE_PERMISSIONS = {
  // Administracion
  "/admin/usuarios":           "usuarios:acceder",
  "/admin/usuarios/crear":     "usuarios:crear",
  "/admin/roles-permisos":     "roles:acceder",

  // Finanzas
  "/finanzas/ingresos":        "ingresos:acceder",
  "/finanzas/egresos":         "egresos:acceder",
  "/finanzas/facturas":        "facturas:acceder",

  // Reclutamiento
  "/reclutamiento/vacantes":   "vacantes:acceder",
  "/reclutamiento/kanban":     "candidatos:acceder",

  // Ventas
  "/generacion-de-leads/list": "leads:acceder",

  // Super Admin
  "/super-admin":              "super:admin",
};
```

### RoutePermissionGuard

Guard que verifica acceso en el middleware/proxy siguiendo estos pasos:

```
1. ¿Es ruta publica? (/sign-in, /api/auth, /access-denied)
   → Acceso permitido

2. ¿Hay sesion?
   → NO: Redirigir a /sign-in

3. ¿Es ruta que solo requiere autenticacion? (/select-tenant)
   → Acceso permitido

4. ¿Es SuperAdmin?
   → Acceso permitido (bypass total)

5. ¿La ruta requiere permisos?
   → NO: Acceso permitido
   → SI: Verificar si tiene el permiso requerido
```

### Redireccion Post-Login

Despues del login, el sistema calcula la ruta por defecto segun los permisos del usuario:

```
SuperAdmin        → /super-admin
usuarios:acceder  → /admin/usuarios
ingresos:acceder  → /finanzas/ingresos
vacantes:acceder  → /reclutamiento/vacantes
leads:acceder     → /generacion-de-leads/list
Sin permisos      → /access-denied
```

La prioridad de rutas esta definida en `ROUTE_PRIORITY` dentro de `route-permissions.config.ts`.

---

## Sidebar Dinamico

El sidebar se filtra automaticamente segun los permisos del usuario.

Ubicacion: `src/core/shared/helpers/sidebar-filter.ts`

```typescript
import { filterSidebarLinks } from "@/core/shared/helpers/sidebar-filter";

// En el componente del sidebar:
const { permissions } = usePermissions();
const visibleLinks = filterSidebarLinks(sidebarLinks, permissions);
```

**Comportamiento:**
- **SuperAdmin**: ve todos los items del sidebar.
- **Usuario normal**: solo ve los items cuya ruta tiene un permiso que el usuario posee.
- **Deny-by-default**: si una ruta no tiene permiso configurado en `ROUTE_PERMISSIONS`, no aparece en el sidebar.

---

## Guia de Uso Rapido

### Proteger una nueva Server Action

```typescript
import { CheckAnyPermissonUseCase } from "@auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

const { hasAnyPermission } = await new CheckAnyPermissonUseCase().execute({
  userId: session.user.id,
  permissions: [PermissionActions.miRecurso.miAccion],
  tenantId,
});
if (!hasAnyPermission) return { error: "Sin permisos" };
```

### Proteger UI condicionalmente

```tsx
<PermissionGate permission="miRecurso:miAccion">
  <MiComponente />
</PermissionGate>
```

### Verificar permisos programaticamente en el cliente

```typescript
const { hasPermission } = usePermissions();

if (hasPermission("vacantes:crear")) {
  // Mostrar boton de crear
}
```

### Agregar un nuevo permiso al sistema

1. Agregar la definicion en `src/core/shared/constants/permissions.ts` (array correspondiente al modulo).
2. Agregar la entrada en `PermissionActions` para autocompletado type-safe.
3. Si protege una ruta, agregar la entrada en `src/core/shared/helpers/route-permissions.config.ts`.
4. Ejecutar el seed o migracion para que el permiso exista en la base de datos.

---

## Archivos Clave

| Archivo | Descripcion |
| ------- | ----------- |
| `src/core/shared/constants/permissions.ts` | Definicion de TODOS los permisos del sistema + `PermissionActions` |
| `src/core/lib/permissions/permission.service.ts` | **Fuente unica de verdad** para verificacion de permisos |
| `src/core/shared/helpers/route-permissions.config.ts` | Mapa ruta → permiso requerido |
| `src/core/shared/helpers/permission-checker.ts` | Re-exports del PermissionService para conveniencia |
| `src/core/shared/helpers/sidebar-filter.ts` | Filtrado del sidebar segun permisos |
| `src/core/shared/context/PermissionContext.tsx` | React Context que carga y distribuye permisos |
| `src/core/shared/hooks/use-permissions.ts` | Hook centralizado `usePermissions()` |
| `src/core/lib/permissions/get-default-route.ts` | Calculo de ruta por defecto post-login |
| `src/core/lib/permissions/route-permission-guard.ts` | Guard para middleware/proxy |
| `src/features/auth-rbac/frontend/components/PermissionGate.tsx` | Componentes `PermissionGate`, `SuperAdminGate`, `AdminGate` |
| `src/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase.ts` | Use case principal para verificar permisos en server actions |
| `src/features/auth-rbac/server/infrastructure/repositories/PrismaUserRoleRepository.ts` | Implementacion Prisma con aislamiento multi-tenant |
| `prisma/schema.prisma` | Modelos `Role`, `UserRole`, `RolePermission`, `Permission` |
