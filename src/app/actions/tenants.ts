'use server';

import { auth } from '@lib/auth';
import prisma from '@lib/prisma';
import { getUserTenants, canAccessTenant, switchTenant, isSuperAdmin } from '@lib/tenants';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

/**
 * Server Actions para gestionar tenants
 */

/**
 * Obtiene todos los tenants del usuario autenticado
 */
export async function getUserTenantsAction() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user) {
      return { error: 'No autenticado', tenants: [] };
    }

    const tenants = await getUserTenants(session.user.id);
    return { error: null, tenants };
  } catch (error) {
    console.error('Error getting user tenants:', error);
    return { error: 'Error al obtener tenants', tenants: [] };
  }
}

/**
 * Crea un nuevo tenant (solo superadmin)
 */
export async function createTenantAction(formData: FormData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user) {
      return { error: 'No autenticado' };
    }

    // Verificar que sea superadmin
    if (!(await isSuperAdmin(session.user.id))) {
      return { error: 'No tienes permisos para crear tenants' };
    }

    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (!name) {
      return { error: 'El nombre es requerido' };
    }

    // Verificar que el nombre y slug sean únicos
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name },
          { slug },
        ],
      },
    });

    if (existingTenant) {
      return { error: 'Ya existe un tenant con ese nombre o slug' };
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
      },
    });

    revalidatePath('/admin');
    return { error: null, tenant };
  } catch (error) {
    console.error('Error creating tenant:', error);
    return { error: 'Error al crear tenant' };
  }
}

/**
 * Cambia el tenant activo en la sesión actual
 */
export async function switchTenantAction(tenantId: string | null) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.session) {
      return { error: 'No autenticado' };
    }

    // Si se proporciona un tenantId, verificar que el usuario pueda acceder
    if (tenantId) {
      const canAccess = await canAccessTenant(session.user.id, tenantId);
      if (!canAccess) {
        return { error: 'No tienes acceso a este tenant' };
      }
    }

    // Actualizar la sesión
    const success = await switchTenant(session.session.token, tenantId);

    if (!success) {
      return { error: 'Error al cambiar tenant' };
    }

    revalidatePath('/dashboard');
    return { error: null };
  } catch (error) {
    console.error('Error switching tenant:', error);
    return { error: 'Error al cambiar tenant' };
  }
}

/**
 * Obtiene el tenant activo de la sesión actual
 */
export async function getCurrentTenantAction() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.session) {
      return { error: 'No autenticado', tenant: null };
    }

    const tenant = await prisma.session.findUnique({
      where: { token: session.session.token },
      include: {
        activeTenant: true,
      },
    });

    return { error: null, tenant: tenant?.activeTenant || null };
  } catch (error) {
    console.error('Error getting current tenant:', error);
    return { error: 'Error al obtener tenant', tenant: null };
  }
}
