"use server";

import { auth } from "@lib/auth";
import prisma from "@lib/prisma";
import { isSuperAdmin } from "@lib/tenants";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Server Actions para gestionar usuarios (solo superadmin)
 */

/**
 * Crea un nuevo usuario (solo superadmin)
 */
export async function createUserAction(formData: FormData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Verificar que sea superadmin
    if (!(await isSuperAdmin(session.user.id))) {
      return { error: "No tienes permisos para crear usuarios" };
    }

    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email y contraseña son requeridos" };
    }

    // Verificar que el email sea único
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Ya existe un usuario con ese email" };
    }

    // Crear usuario usando Better Auth API HTTP
    // Necesitamos hacer una llamada a la API de Better Auth
    const betterAuthUrl =
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
      "http://localhost:3000";

    try {
      const response = await fetch(`${betterAuthUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        return { error: result.error?.message || "Error al crear usuario" };
      }

      // Obtener el usuario creado
      const createdUser = await prisma.user.findUnique({
        where: { email },
      });

      revalidatePath("/admin");
      return { error: null, user: createdUser };
    } catch (error) {
      console.error("Error creating user with Better Auth:", error);
      return { error: "Error al crear usuario con Better Auth" };
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Error al crear usuario" };
  }
}

/**
 * Asigna un usuario a un tenant con un rol específico (solo superadmin)
 */
export async function assignUserToTenantAction(formData: FormData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Verificar que sea superadmin
    if (!(await isSuperAdmin(session.user.id))) {
      return { error: "No tienes permisos para asignar usuarios a tenants" };
    }

    const userId = formData.get("userId") as string;
    const tenantId = formData.get("tenantId") as string;
    const roleName = formData.get("roleName") as string;

    if (!userId || !tenantId || !roleName) {
      return { error: "Usuario, tenant y rol son requeridos" };
    }

    // Obtener el rol
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return { error: "Rol no encontrado" };
    }

    // Verificar que el tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return { error: "Tenant no encontrado" };
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: "Usuario no encontrado" };
    }

    // Verificar si ya existe esta asignación
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId,
        tenantId,
        roleId: role.id,
      },
    });

    if (existingUserRole) {
      return { error: "El usuario ya tiene este rol en este tenant" };
    }

    // Crear la asignación
    const userRole = await prisma.userRole.create({
      data: {
        userId,
        tenantId,
        roleId: role.id,
      },
      include: {
        user: true,
        tenant: true,
        role: true,
      },
    });

    revalidatePath("/admin");
    return { error: null, userRole };
  } catch (error) {
    console.error("Error assigning user to tenant:", error);
    return { error: "Error al asignar usuario a tenant" };
  }
}

/**
 * Obtiene todos los usuarios de un tenant
 */
export async function getTenantUsersAction(tenantId: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", users: [] };
    }

    // Verificar que sea superadmin o que pertenezca al tenant
    const isAdmin = await isSuperAdmin(session.user.id);

    if (!isAdmin) {
      const userRole = await prisma.userRole.findFirst({
        where: {
          userId: session.user.id,
          tenantId,
        },
      });

      if (!userRole) {
        return { error: "No tienes acceso a este tenant", users: [] };
      }
    }

    // Obtener usuarios del tenant
    const userRoles = await prisma.userRole.findMany({
      where: {
        tenantId,
      },
      include: {
        user: true,
        role: true,
      },
    });

    // Agrupar por usuario y roles
    const userMap = new Map();

    for (const userRole of userRoles) {
      const userId = userRole.userId;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          ...userRole.user,
          roles: [],
        });
      }
      userMap.get(userId).roles.push(userRole.role);
    }

    const users = Array.from(userMap.values());

    return { error: null, users };
  } catch (error) {
    console.error("Error getting tenant users:", error);
    return { error: "Error al obtener usuarios", users: [] };
  }
}
