"use client";

import Link from "next/link";
import { Button } from "@shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/card";
import { useAuth } from "@/core/shared/hooks/use-auth";
import { useRouter } from "next/navigation";

/**
 * Página de acceso denegado
 *
 * Se muestra cuando un usuario intenta acceder a una ruta
 * para la cual no tiene los permisos necesarios.
 */
export default function AccessDeniedPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    await logout("/sign-in");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <CardTitle className="text-2xl text-destructive">
            Acceso Denegado
          </CardTitle>
          <CardDescription className="text-base">
            No tienes permisos para acceder a esta sección.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isAuthenticated && user && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="text-muted-foreground">Has iniciado sesión como:</p>
              <p className="font-medium">{user.email}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground text-center">
            <p>Esto puede deberse a:</p>
            <ul className="list-disc list-inside mt-2 text-left space-y-1">
              <li>No tienes los permisos necesarios</li>
              <li>No estás asignado a ninguna organización</li>
              <li>Tu sesión ha expirado</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              Volver Atrás
            </Button>

            {isAuthenticated ? (
              <>
                <Link href="/" className="w-full">
                  <Button className="w-full">Ir al Inicio</Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive"
                >
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Link href="/sign-in" className="w-full">
                <Button className="w-full">Iniciar Sesión</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
