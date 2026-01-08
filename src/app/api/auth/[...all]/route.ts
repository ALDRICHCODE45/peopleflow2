import { auth } from "@lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Ruta API de Better Auth para Next.js App Router
 *
 * Esta ruta maneja todas las peticiones de autenticación:
 * - /api/auth/sign-in
 * - /api/auth/sign-up
 * - /api/auth/sign-out
 * - /api/auth/session
 * - etc.
 *
 * El catch-all [...all] captura todas las rutas bajo /api/auth/*
 */
export const { GET, POST } = toNextJsHandler(auth.handler);
