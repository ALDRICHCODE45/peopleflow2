"use client";

import { authClient } from "@lib/auth-client";
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
import { useState } from "react";

/**
 * Componente de ejemplo para demostrar Better Auth
 *
 * Este componente muestra:
 * - Cómo obtener la sesión actual con useSession
 * - Cómo registrar un nuevo usuario (signUp)
 * - Cómo iniciar sesión (signIn)
 * - Cómo cerrar sesión (signOut)
 */
export function AuthExample() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Registrar nuevo usuario
        const result = await authClient.signUp.email({
          email,
          password,
          name,
        });

        if (result.error) {
          setError(result.error.message || "Error al registrar usuario");
        } else {
          // Refrescar la sesión después del registro
          await refetch();
          setEmail("");
          setPassword("");
          setName("");
        }
      } else {
        // Iniciar sesión
        const result = await authClient.signIn.email({
          email,
          password,
        });

        if (result.error) {
          setError(result.error.message || "Error al iniciar sesión");
        } else {
          // Refrescar la sesión después del login
          await refetch();
          setEmail("");
          setPassword("");
        }
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando sesión...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>¡Bienvenido!</CardTitle>
          <CardDescription>Has iniciado sesión correctamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email:</p>
            <p className="font-medium">{session.user.email}</p>
          </div>
          {session.user.name && (
            <div>
              <p className="text-sm text-muted-foreground">Nombre:</p>
              <p className="font-medium">{session.user.name}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">ID de Usuario:</p>
            <p className="font-mono text-xs">{session.user.id}</p>
          </div>
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Cerrando sesión..." : "Cerrar Sesión"}
          </Button>
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground mb-2">
              Datos de sesión (JSON):
            </p>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isSignUp ? "Registrarse" : "Iniciar Sesión"}</CardTitle>
        <CardDescription>
          {isSignUp
            ? "Crea una nueva cuenta para comenzar"
            : "Ingresa tus credenciales para continuar"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required={isSignUp}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading
              ? "Procesando..."
              : isSignUp
                ? "Registrarse"
                : "Iniciar Sesión"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="w-full"
          >
            {isSignUp
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
