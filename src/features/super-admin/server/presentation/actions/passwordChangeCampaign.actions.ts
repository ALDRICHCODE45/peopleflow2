"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import prisma from "@lib/prisma";
import { inngest } from "@core/shared/inngest/inngest";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { SUPER_ADMIN_PERMISSION_NAME } from "@core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";
import { CheckAnyPermissonUseCase } from "@features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";

/**
 * Email hardcodeado para envios de prueba.
 * Cambiarlo aqui si el destinatario de pruebas cambia.
 */
const TEST_EMAIL_RECIPIENT = "nocheblanca92@gmail.com";

interface ActionResult {
  error: string | null;
  enqueued?: number;
}

interface SuperAdminGuard {
  userId: string;
  userName: string | null;
  /** Tenant arbitrario al que pertenece el super-admin, usado para Notification.tenantId */
  fallbackTenantId: string;
}

/**
 * Verifica que el usuario actual sea super-admin.
 * Devuelve datos del super-admin o un error.
 *
 * Nota: super:admin es un permiso GLOBAL — se chequea con tenantId=null.
 * El PermissionService busca el permiso en cualquier rol del usuario.
 */
async function requireSuperAdmin(): Promise<
  { ok: true; data: SuperAdminGuard } | { ok: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { ok: false, error: ServerErrors.notAuthenticated };

  const result = await new CheckAnyPermissonUseCase().execute({
    userId: session.user.id,
    permissions: [SUPER_ADMIN_PERMISSION_NAME],
    tenantId: null, // super:admin es permiso global
  });

  if (!result.hasAnyPermission) {
    return { ok: false, error: "Sin permisos de super administrador" };
  }

  // Necesitamos un tenantId valido para Notification.tenantId (es required en
  // el schema). Tomamos uno cualquiera del super-admin.
  const anyRole = await prisma.userRole.findFirst({
    where: {
      userId: session.user.id,
      tenantId: { not: null },
    },
    select: { tenantId: true },
  });

  if (!anyRole?.tenantId) {
    return {
      ok: false,
      error: "El super-admin no tiene ningun tenant asignado para auditoria",
    };
  }

  return {
    ok: true,
    data: {
      userId: session.user.id,
      userName: session.user.name ?? null,
      fallbackTenantId: anyRole.tenantId,
    },
  };
}

/**
 * Cuenta cuantos usuarios activos recibirian el correo de campania (sin enviar
 * nada). Util para mostrar en la UI antes de confirmar.
 */
export async function countPasswordChangeCampaignRecipientsAction(): Promise<{
  error: string | null;
  count: number;
}> {
  try {
    const guard = await requireSuperAdmin();
    if (!guard.ok) return { error: guard.error, count: 0 };

    const count = await prisma.user.count({
      where: {
        banned: false,
        email: { not: "" },
      },
    });

    return { error: null, count };
  } catch (error) {
    console.error("Error counting campaign recipients:", error);
    return { error: "Error al contar destinatarios", count: 0 };
  }
}

/**
 * Encola un email de prueba al TEST_EMAIL_RECIPIENT via Inngest.
 * Util para que el super-admin vea como se ve el correo antes de mandarlo
 * masivo.
 */
export async function sendPasswordChangeTestEmailAction(): Promise<ActionResult> {
  try {
    const guard = await requireSuperAdmin();
    if (!guard.ok) return { error: guard.error };

    await inngest.send({
      name: InngestEvents.email.send,
      data: {
        template: "password-change-campaign",
        tenantId: guard.data.fallbackTenantId,
        triggeredById: guard.data.userId,
        data: {
          recipientName: guard.data.userName,
          recipientEmail: TEST_EMAIL_RECIPIENT,
          isTest: true,
        },
      },
    });

    return { error: null, enqueued: 1 };
  } catch (error) {
    console.error("Error sending test password change email:", error);
    return { error: "Error al encolar el correo de prueba" };
  }
}

/**
 * Encola el envio de la campania de cambio de contrasena a TODOS los usuarios
 * activos del sistema (no banneados, con email).
 *
 * Inngest se encarga de procesar la cola con concurrency: 5 (definido en el
 * handler handleSendStandaloneEmail), reintentos automaticos y observabilidad
 * via dashboard.
 */
export async function sendPasswordChangeCampaignAction(): Promise<ActionResult> {
  try {
    const guard = await requireSuperAdmin();
    if (!guard.ok) return { error: guard.error };

    // Trae usuarios activos junto con uno de sus tenants (para Notification.tenantId).
    const users = await prisma.user.findMany({
      where: {
        banned: false,
        email: { not: "" },
      },
      select: {
        id: true,
        email: true,
        name: true,
        userRoles: {
          where: { tenantId: { not: null } },
          select: { tenantId: true },
          take: 1,
        },
      },
    });

    if (users.length === 0) {
      return { error: "No hay destinatarios para enviar", enqueued: 0 };
    }

    // Construye un evento por usuario. Si el usuario no tiene tenant (raro
    // para usuarios activos), usamos el del super-admin como fallback.
    const events = users.map((u) => ({
      name: InngestEvents.email.send as typeof InngestEvents.email.send,
      data: {
        template: "password-change-campaign" as const,
        tenantId: u.userRoles[0]?.tenantId ?? guard.data.fallbackTenantId,
        triggeredById: guard.data.userId,
        data: {
          recipientName: u.name,
          recipientEmail: u.email,
          isTest: false,
        },
      },
    }));

    // Inngest acepta arrays. El handler procesa con concurrency: 5,
    // reintentos automaticos y observabilidad en su dashboard.
    await inngest.send(events);

    return { error: null, enqueued: events.length };
  } catch (error) {
    console.error("Error dispatching password change campaign:", error);
    return { error: "Error al encolar la campania" };
  }
}
