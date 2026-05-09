"use client";

import { useState } from "react";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Card, CardContent } from "@shadcn/card";
import { Field, FieldError, FieldGroup } from "@/core/shared/ui/shadcn/field";
import Image from "next/image";
import Link from "next/link";
import { Routes } from "@/core/shared/constants/routes";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { showToast } from "@/core/shared/components/ShowToast";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError("El correo electrónico es requerido");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Ingresa un correo electrónico válido");
      return false;
    }

    setEmailError(null);
    return true;
  };

  const handleBlur = () => {
    setEmailTouched(true);
    validateEmail(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailTouched(true);
    if (!validateEmail(email)) {
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: Routes.resetPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ?? "Error al solicitar el restablecimiento"
        );
      }

      setSubmitted(true);
      showToast({
        type: "success",
        title: "Solicitud enviada",
        description:
          "Si el correo existe, recibirás un enlace para restablecer tu contraseña.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el correo de restablecimiento.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const isInvalid = emailTouched && emailError !== null;

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-sm rounded-4xl">
        <CardContent className="p-6 pt-10">
          <div className="flex flex-col items-center space-y-6 w-full">
            <Image
              src="/logos/logo-principal.webp"
              alt="PeopleFlow Logo"
              width={120}
              height={20}
              className="object-contain"
              priority
            />

            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold text-foreground">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-muted-foreground text-sm">
                Ingresa tu correo electrónico y te enviaremos un enlace para{" "}
                <span className="text-foreground">
                  restablecer tu contraseña.
                </span>
              </p>
            </div>

            {submitted ? (
              <div className="w-full space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Si el correo existe en nuestro sistema, recibirás un enlace
                  para restablecer tu contraseña en los próximos minutos.
                </p>
                <Link href={Routes.signIn}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full rounded-xl"
                    size="lg"
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      className="mr-2"
                      size={18}
                    />
                    Volver al inicio de sesión
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="w-full">
                  <FieldGroup className="w-full">
                    <Field data-invalid={isInvalid} className="w-full">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onBlur={handleBlur}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailTouched) {
                            validateEmail(e.target.value);
                          }
                        }}
                        aria-invalid={isInvalid}
                        placeholder="correo@ejemplo.com"
                        autoComplete="email"
                        className="w-full rounded-xl"
                        disabled={isPending}
                      />
                      {isInvalid && emailError && (
                        <FieldError errors={[{ message: emailError }]} />
                      )}
                    </Field>
                  </FieldGroup>

                  <div className="w-full mt-6 space-y-3">
                    <Button
                      type="submit"
                      className="w-full rounded-xl"
                      size="lg"
                      disabled={isPending}
                    >
                      {isPending ? "Enviando..." : "Enviar enlace"}
                    </Button>

                    <Link href={Routes.signIn}>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full rounded-xl"
                        size="lg"
                        disabled={isPending}
                      >
                        <HugeiconsIcon
                          icon={ArrowLeft01Icon}
                          className="mr-2"
                          size={18}
                        />
                        Volver al inicio de sesión
                      </Button>
                    </Link>
                  </div>
                </form>

                <p className="text-center text-xs w-full text-muted-foreground mt-2">
                  Por seguridad, recibirás el mismo mensaje tanto si el correo
                  existe como si no.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
