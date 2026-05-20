import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, captcha, emailOTP } from "better-auth/plugins";
import prisma from "./prisma";
import nodemailer from "nodemailer";
import {
  generateOTPVerificationEmail,
  generateOTPVerificationPlainText,
} from "@features/Notifications/server/infrastructure/templates/otpVerificationTemplate";
import {
  generatePasswordResetEmail,
  generatePasswordResetPlainText,
} from "@features/Notifications/server/infrastructure/templates/passwordResetTemplate";

const isDev = process.env.NODE_ENV !== "production";

// Create email transporter for OTP emails
const otpEmailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Configuración de Better Auth
 *
 * Este archivo crea la instancia principal de Better Auth que se usa en el servidor.
 * Utiliza el adaptador de Prisma para conectarse a la base de datos PostgreSQL.
 *
 * Características habilitadas:
 * - Email y contraseña (autenticación básica)
 *
 * Para más plugins y funcionalidades, consulta:
 * https://www.better-auth.com/docs
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // PostgreSQL según tu configuración
  }),
  trustedOrigins: [process.env.TRUST_URLS, process.env.BETTER_AUTH_URL]
    .filter(Boolean)
    .flatMap((value) => value!.split(","))
    .map((value) => value.trim())
    .filter(Boolean),
  user: {
    additionalFields: {
      // Project-specific avatar field. We persist user avatars in `User.avatar`
      // (separate from Better Auth's default `image`) so they're admin-managed
      // and not overwritten by OAuth providers. Exposing it here makes it flow
      // through `authClient.useSession()` everywhere we use `useAuth()`.
      avatar: {
        type: "string",
        required: false,
        input: false, // not settable during signup; managed via admin/profile flows
      },
    },
  },
  emailAndPassword: {
    enabled: true, // Habilita autenticación con email y contraseña
    minPasswordLength: 8, // Sincronizado con passwordPolicy.ts (PASSWORD_MIN)
    maxPasswordLength: 128, // Sincronizado con passwordPolicy.ts (PASSWORD_MAX)
    revokeSessionsOnPasswordReset: true, // Revoke all sessions on password reset for security
    async sendResetPassword({ user, url }) {
      // Active user gate: skip email for banned/deactivated users
      const targetUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { banned: true, name: true },
      });

      // Silently skip sending email if user is banned
      if (!targetUser || targetUser.banned) {
        return;
      }

      const htmlContent = generatePasswordResetEmail({
        recipientName: targetUser.name || undefined,
        resetUrl: url,
        expiresInMinutes: 60, // 1 hour
      });

      const plainText = generatePasswordResetPlainText({
        recipientName: targetUser.name || undefined,
        resetUrl: url,
        expiresInMinutes: 60,
      });

      await otpEmailTransporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@peopleflow.com",
        to: user.email,
        subject: "Restablecer contraseña - PeopleFlow",
        text: plainText,
        html: htmlContent,
      });
    },
  },
  plugins: [
    admin(),
    ...(isDev
      ? []
      : [
          captcha({
            provider: "cloudflare-turnstile",
            secretKey: process.env.CLOUDFLARE_SECRET_KEY!,
            endpoints: ["/sign-up/email", "/sign-in/email"], // Exclude /request-password-reset — protected by anti-enumeration + banned user gate
          }),
        ]),
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      sendVerificationOTP: async ({ email, otp }) => {
        // Get user name if available
        const user = await prisma.user.findUnique({
          where: { email },
          select: { name: true },
        });

        const htmlContent = generateOTPVerificationEmail({
          recipientName: user?.name || undefined,
          otp,
          expiresInMinutes: 5,
        });

        const plainText = generateOTPVerificationPlainText({
          recipientName: user?.name || undefined,
          otp,
          expiresInMinutes: 5,
        });

        await otpEmailTransporter.sendMail({
          from: process.env.SMTP_FROM || "noreply@peopleflow.com",
          to: email,
          subject: "Codigo de verificacion - PeopleFlow",
          text: plainText,
          html: htmlContent,
        });
      },
    }),
  ],
  // La URL y el secret se toman automáticamente de las variables de entorno:
  // BETTER_AUTH_URL y BETTER_AUTH_SECRET
});
