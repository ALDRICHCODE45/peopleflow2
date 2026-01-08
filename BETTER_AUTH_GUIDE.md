# Guía de Better Auth - PeopleFlow2

Esta guía te ayudará a entender cómo usar Better Auth en tu proyecto Next.js con Prisma.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Variables de Entorno](#variables-de-entorno)
3. [Uso en el Cliente (React)](#uso-en-el-cliente-react)
4. [Uso en el Servidor (Server Components y Server Actions)](#uso-en-el-servidor)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Próximos Pasos](#próximos-pasos)

## 🔧 Configuración Inicial

Better Auth ya está configurado en tu proyecto. Aquí está lo que se configuró:

- ✅ Instalación de `better-auth` y `@better-auth/cli`
- ✅ Configuración del servidor en `src/core/lib/auth.ts`
- ✅ Cliente React en `src/core/lib/auth-client.ts`
- ✅ Ruta API en `src/app/api/auth/[...all]/route.ts`
- ✅ Esquema de base de datos generado y aplicado

## 🔐 Variables de Entorno

**IMPORTANTE:** Agrega estas variables a tu archivo `.env`:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=EwDq43SCPujb1XiIscJffXslmDfmKHiK8wCn3qmjr74=
BETTER_AUTH_URL=http://localhost:3000

# Para producción, cambia BETTER_AUTH_URL a tu dominio:
# BETTER_AUTH_URL=https://tudominio.com

# Opcional: Si quieres usar el cliente en el navegador con una URL diferente
# NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

**Nota de Seguridad:** En producción, genera un nuevo `BETTER_AUTH_SECRET` usando:
```bash
openssl rand -base64 32
```

## 🎨 Uso en el Cliente (React)

### Obtener la Sesión Actual

```tsx
"use client";

import { authClient } from "@lib/auth-client";

export function UserProfile() {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  if (isPending) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!session) return <div>No hay sesión activa</div>;

  return (
    <div>
      <h1>¡Hola {session.user.name || session.user.email}!</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### Registrar un Nuevo Usuario

```tsx
"use client";

import { authClient } from "@lib/auth-client";
import { useState } from "react";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSignUp = async () => {
    const result = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (result.error) {
      console.error("Error:", result.error.message);
    } else {
      console.log("Usuario registrado:", result.data);
      // La sesión se actualiza automáticamente
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
      />
      <button type="submit">Registrarse</button>
    </form>
  );
}
```

### Iniciar Sesión

```tsx
"use client";

import { authClient } from "@lib/auth-client";

const handleSignIn = async () => {
  const result = await authClient.signIn.email({
    email: "usuario@ejemplo.com",
    password: "contraseña123",
  });

  if (result.error) {
    console.error("Error:", result.error.message);
  } else {
    console.log("Sesión iniciada:", result.data);
  }
};
```

### Cerrar Sesión

```tsx
"use client";

import { authClient } from "@lib/auth-client";

const handleSignOut = async () => {
  await authClient.signOut();
  // La sesión se actualiza automáticamente
};
```

## 🖥️ Uso en el Servidor

### Server Component - Obtener Sesión

```tsx
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirigir si no hay sesión
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Bienvenido {session.user.name || session.user.email}</h1>
      <p>ID: {session.user.id}</p>
    </div>
  );
}
```

### Server Action - Validar Sesión

```tsx
"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("No autenticado");
  }

  return session.user;
}

// Usar en un Server Component:
export default async function Page() {
  const user = await getCurrentUser();
  return <div>Hola {user.email}</div>;
}
```

## 📚 Ejemplos Prácticos

### Componente Completo de Autenticación

Ya tienes un componente de ejemplo en `src/app/components/auth-example.tsx` que incluye:
- Formulario de registro
- Formulario de inicio de sesión
- Visualización de la sesión actual
- Cerrar sesión

Puedes usarlo así:

```tsx
import { AuthExample } from "./components/auth-example";

export default function Page() {
  return <AuthExample />;
}
```

### Proteger Rutas Completo

```tsx
// src/app/dashboard/page.tsx
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bienvenido, {session.user.email}</p>
    </div>
  );
}
```

## 🚀 Próximos Pasos

### Plugins Disponibles

Better Auth tiene muchos plugins que puedes agregar:

1. **Social Auth (OAuth)**: Google, GitHub, Discord, etc.
   ```ts
   import { socialProviders } from "better-auth/plugins";
   
   export const auth = betterAuth({
     // ... configuración existente
     plugins: [
       socialProviders({
         providers: ["github", "google"],
       }),
     ],
   });
   ```

2. **Two-Factor Authentication (2FA)**
3. **Magic Link**
4. **Username Authentication**
5. **Passkey/WebAuthn**

### Recursos Adicionales

- **Documentación oficial**: https://www.better-auth.com/docs
- **API Reference**: https://www.better-auth.com/docs/reference
- **Plugins**: https://www.better-auth.com/docs/plugins

### Comandos Útiles

```bash
# Generar nuevo esquema de base de datos (después de agregar plugins)
bunx better-auth generate --config src/core/lib/auth.ts

# Aplicar cambios a la base de datos
bunx prisma db push

# Regenerar el cliente de Prisma
bunx prisma generate
```

## 🔍 Estructura de Archivos

```
src/
├── core/
│   └── lib/
│       ├── auth.ts          # Configuración del servidor
│       └── auth-client.ts   # Cliente React
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts  # Ruta API de Better Auth
│   └── components/
│       └── auth-example.tsx  # Componente de ejemplo
```

## 📝 Notas Importantes

1. **Sesiones**: Better Auth maneja las sesiones automáticamente usando cookies HTTP-only seguras.

2. **Base de Datos**: Las tablas necesarias ya están creadas:
   - `user`: Usuarios
   - `session`: Sesiones activas
   - `account`: Cuentas vinculadas (para OAuth, etc.)
   - `verification`: Tokens de verificación

3. **TypeScript**: Better Auth tiene tipos completos de TypeScript, aprovecha el autocompletado.

4. **Seguridad**: Nunca expongas `BETTER_AUTH_SECRET` en el cliente. Solo se usa en el servidor.

¡Disfruta usando Better Auth! 🎉
