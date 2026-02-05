# Plan: Corregir ciclo de redirecciones en sesiones expiradas

**Fecha:** 2026-02-05
**Estado:** Pendiente de implementación

---

## Diagnóstico del Problema

### Causa Raíz Confirmada

El bug está en `src/proxy.ts` líneas 82-84:

```typescript
if (isLoggedIn && pathname === "/sign-in") {
  return NextResponse.redirect(new URL("/", request.url));
}
```

**El problema:** El proxy solo verifica si **existe** una cookie de sesión (`better-auth.session_token`), pero NO valida si la sesión está **expirada en la base de datos**.

### Flujo del Loop

```
1. Usuario regresa al día siguiente → cookie existe PERO sesión expirada en BD
2. Visita "/" → proxy ve cookie ✓ → permite acceso
3. page.tsx llama auth.api.getSession() → retorna null (sesión expirada)
4. page.tsx redirige a "/sign-in"
5. proxy ve cookie ✓ en "/sign-in" → redirige a "/" (línea 82-84)
6. LOOP INFINITO: / → /sign-in → / → /sign-in...
```

### Por qué NO es problema de Better Auth

- Better Auth maneja correctamente la expiración de sesiones
- El plugin `emailOtp.verifyEmail()` sí actualiza `emailVerified = true` automáticamente
- El problema es que el proxy no puede validar sesiones (no tiene acceso a BD)

---

## Solución Propuesta

### Opción Recomendada: Eliminar la redirección automática desde /sign-in

**Archivo:** `src/proxy.ts`

**Cambio:** Eliminar líneas 82-84 o modificarlas para permitir acceso a `/sign-in` siempre.

**Lógica:** Si el usuario tiene sesión válida y accede a `/sign-in`, la página de sign-in puede manejar eso del lado del cliente (ya tiene AuthGuard). Si la sesión está expirada, el usuario puede hacer login normalmente.

---

## Archivos a Modificar

| Archivo        | Cambio                                                       |
| -------------- | ------------------------------------------------------------ |
| `src/proxy.ts` | Eliminar/modificar lógica de redirección de `/sign-in` a `/` |

---

## Implementación

```typescript
// src/proxy.ts - ANTES (líneas 80-84):
// 3. Si está logueado y accede a sign-in, redirigir a la raíz
if (isLoggedIn && pathname === "/sign-in") {
  return NextResponse.redirect(new URL("/", request.url));
}

// DESPUÉS - Opción A: Eliminar completamente estas líneas
// (dejar que /sign-in maneje su propia lógica)

// DESPUÉS - Opción B: Agregar /sign-in a PUBLIC_PATHS y eliminar este bloque
// La página de sign-in ya tiene lógica para redirigir usuarios autenticados
```

---

## Verificación

1. **Iniciar sesión normalmente** → verificar que todo funcione
2. **Cerrar navegador sin logout** → esperar que sesión expire (o borrar sesión en BD manualmente)
3. **Volver a la aplicación** → debe mostrar página de login sin loop
4. **Iniciar sesión de nuevo** → flujo completo debe funcionar

---

## Notas Adicionales

- El proxy en Next.js 16 **no tiene acceso a la base de datos**, por lo que no puede validar si una sesión está expirada
- Better Auth maneja la expiración correctamente del lado del servidor (en `auth.api.getSession()`)
- La solución es dejar que las páginas manejen la lógica de autenticación, no el proxy
