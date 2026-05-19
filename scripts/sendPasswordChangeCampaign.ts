/**
 * Password Change Campaign
 *
 * Envia un email a todos los usuarios activos del sistema invitandolos a
 * actualizar su contrasena (especialmente los que aun tienen la contrasena
 * por defecto). El email no contiene un token de reset — solo un link a
 * /forgot-password para que el usuario inicie el flujo estandar.
 *
 * Ventajas de no enviar token:
 *  - Si el correo se reenvia o filtra, no expone acceso a la cuenta.
 *  - Reutiliza el flujo de "olvide mi contrasena" que ya funciona y los usuarios
 *    conocen.
 *  - No requiere tocar Better Auth, tabla Verification, ni migraciones.
 *
 * Uso:
 *   bun run scripts/sendPasswordChangeCampaign.ts --all
 *   bun run scripts/sendPasswordChangeCampaign.ts --tenant=<tenantId>
 *   bun run scripts/sendPasswordChangeCampaign.ts --email=aldrich@example.com   # prueba con uno solo
 *   bun run scripts/sendPasswordChangeCampaign.ts --all --dry-run               # no envia, solo lista
 *
 * Filtros aplicados siempre:
 *  - excluye usuarios banneados (User.banned = true)
 *  - excluye filas sin email
 *  - excluye duplicados de email (un mismo User puede aparecer en N tenants)
 *
 * Throttle:
 *  - 200ms entre emails (~5/seg) para no quemar el SMTP.
 */

import prisma from "../src/core/lib/prisma";
import nodemailer from "nodemailer";
import {
  generatePasswordChangeCampaignEmail,
  generatePasswordChangeCampaignPlainText,
} from "../src/features/Notifications/server/infrastructure/templates/passwordChangeCampaignTemplate";

const APP_URL = process.env.BETTER_AUTH_URL || "https://www.peopleflow.tech";
const FORGOT_PASSWORD_URL = `${APP_URL}/forgot-password`;
const THROTTLE_MS = 200;

interface CliArgs {
  all: boolean;
  tenantId?: string;
  email?: string;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const out: CliArgs = { all: false, dryRun: false };

  for (const arg of args) {
    if (arg === "--all") out.all = true;
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg.startsWith("--tenant=")) out.tenantId = arg.slice("--tenant=".length);
    else if (arg.startsWith("--email=")) out.email = arg.slice("--email=".length);
    else {
      console.error(`❌ Argumento desconocido: ${arg}`);
      process.exit(1);
    }
  }

  if (!out.all && !out.tenantId && !out.email) {
    console.error("❌ Debes especificar uno de: --all, --tenant=<id>, --email=<addr>");
    console.error("   Agrega --dry-run para no enviar nada y solo listar destinatarios.");
    process.exit(1);
  }

  return out;
}

interface Recipient {
  id: string;
  email: string;
  name: string | null;
}

async function fetchRecipients(args: CliArgs): Promise<Recipient[]> {
  if (args.email) {
    const user = await prisma.user.findUnique({
      where: { email: args.email },
      select: { id: true, email: true, name: true, banned: true },
    });
    if (!user) {
      console.error(`❌ No se encontró usuario con email ${args.email}`);
      process.exit(1);
    }
    if (user.banned) {
      console.error(`❌ El usuario ${args.email} esta banneado, no se envia.`);
      process.exit(1);
    }
    return [{ id: user.id, email: user.email, name: user.name }];
  }

  if (args.tenantId) {
    // Verifica que el tenant exista
    const tenant = await prisma.tenant.findUnique({
      where: { id: args.tenantId },
      select: { id: true, name: true },
    });
    if (!tenant) {
      console.error(`❌ No se encontró tenant con id ${args.tenantId}`);
      process.exit(1);
    }
    console.log(`🏢 Tenant: ${tenant.name} (${tenant.id})`);

    // Usuarios con al menos un UserRole en este tenant (pertenencia = tener un rol)
    const userRoles = await prisma.userRole.findMany({
      where: { tenantId: args.tenantId },
      select: {
        user: { select: { id: true, email: true, name: true, banned: true } },
      },
    });

    const map = new Map<string, Recipient>();
    for (const ur of userRoles) {
      if (!ur.user || ur.user.banned || !ur.user.email) continue;
      map.set(ur.user.id, {
        id: ur.user.id,
        email: ur.user.email,
        name: ur.user.name,
      });
    }
    return [...map.values()];
  }

  // --all
  const users = await prisma.user.findMany({
    where: { banned: false, email: { not: "" } },
    select: { id: true, email: true, name: true },
  });
  return users;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs();

  console.log("📨 Campaña de cambio de contraseña — PeopleFlow");
  console.log("");
  console.log(`   App URL:       ${APP_URL}`);
  console.log(`   Forgot URL:    ${FORGOT_PASSWORD_URL}`);
  console.log(`   Modo:          ${args.dryRun ? "DRY RUN (no envia)" : "ENVIANDO"}`);
  console.log("");

  const recipients = await fetchRecipients(args);

  if (recipients.length === 0) {
    console.log("⚠️  No hay destinatarios. Nada para hacer.");
    return;
  }

  console.log(`📋 Destinatarios: ${recipients.length}`);
  console.log("");

  if (args.dryRun) {
    for (const r of recipients) {
      console.log(`   - ${r.email}${r.name ? ` (${r.name})` : ""}`);
    }
    console.log("");
    console.log("✅ Dry run completado. No se envió nada.");
    return;
  }

  // Verifica variables de entorno SMTP antes de mandar
  const requiredEnv = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ Faltan variables de entorno: ${missing.join(", ")}`);
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const from = process.env.SMTP_FROM || "noreply@peopleflow.com";
  let sent = 0;
  let failed = 0;
  const errors: { email: string; reason: string }[] = [];

  for (const r of recipients) {
    try {
      const html = generatePasswordChangeCampaignEmail({
        recipientName: r.name || undefined,
        forgotPasswordUrl: FORGOT_PASSWORD_URL,
      });
      const text = generatePasswordChangeCampaignPlainText({
        recipientName: r.name || undefined,
        forgotPasswordUrl: FORGOT_PASSWORD_URL,
      });

      await transporter.sendMail({
        from,
        to: r.email,
        subject: "Actualiza tu contraseña — PeopleFlow",
        text,
        html,
      });

      sent++;
      console.log(`   ✅ [${sent}/${recipients.length}] ${r.email}`);
    } catch (error) {
      failed++;
      const reason = error instanceof Error ? error.message : String(error);
      errors.push({ email: r.email, reason });
      console.error(`   ❌ [${sent + failed}/${recipients.length}] ${r.email} — ${reason}`);
    }

    if (sent + failed < recipients.length) {
      await sleep(THROTTLE_MS);
    }
  }

  console.log("");
  console.log("📊 Resumen:");
  console.log(`   Enviados:  ${sent}`);
  console.log(`   Fallidos:  ${failed}`);

  if (errors.length > 0) {
    console.log("");
    console.log("⚠️  Errores:");
    for (const e of errors) {
      console.log(`   - ${e.email}: ${e.reason}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("💥 Error fatal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
