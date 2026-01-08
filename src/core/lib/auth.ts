import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

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
  emailAndPassword: {
    enabled: true, // Habilita autenticación con email y contraseña
  },
  // La URL y el secret se toman automáticamente de las variables de entorno:
  // BETTER_AUTH_URL y BETTER_AUTH_SECRET
});
