"use client";

import { useAuth } from "@core/shared/hooks/use-auth";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Label } from "@shadcn/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/card";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const SignInPage = () => {
  const { user, isAuthenticated, isLoading, isPending, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && !isPending) {
      router.push("/"); // Redirige a raíz, que determina la ruta según permisos
    }
  }, [isAuthenticated, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        setError(result.error || "Error al iniciar sesión");
      } else {
        // La redirección se maneja en el useEffect
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando...</CardTitle>
          <CardDescription>Verificando sesión...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isAuthenticated && user) {
    return null; // El useEffect manejará la redirección
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold">
          Bienvenido de nuevo
        </CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              disabled={isSubmitting}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={isSubmitting}
              className="h-11"
            />
          </div>
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
              {error}
            </div>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full h-11"
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
