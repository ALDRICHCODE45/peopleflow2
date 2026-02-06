"use client";

import { useAuth } from "@core/shared/hooks/use-auth";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/card";
import Image from "next/image";
import { useSignInForm } from "../hooks/useSignInForm";
import { Field, FieldError, FieldGroup } from "@/core/shared/ui/shadcn/field";
import {
  PasswordInput,
  PasswordInputAdornmentToggle,
  PasswordInputInput,
} from "@/core/shared/ui/shadcn/password-input";
import { useCallback, useEffect, useRef } from "react";
import CookieConsent from "@/core/shared/components/cookie-consent";

const isDev = process.env.NODE_ENV !== "production";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        },
      ) => string;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
      remove: (widgetId: string) => void;
    };
  }
}

export const SignInPage = () => {
  const { isPending } = useAuth();

  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  const getCaptchaToken = useCallback((): string | null => {
    return tokenRef.current;
  }, []);

  const form = useSignInForm(getCaptchaToken);

  const resetTurnstile = useCallback(() => {
    tokenRef.current = null;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  useEffect(() => {
    if (isDev) return;

    const container = turnstileRef.current;
    if (!container) return;

    const renderWidget = () => {
      if (!window.turnstile || widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY!,
        callback: (token: string) => {
          tokenRef.current = token;
        },
        "expired-callback": () => {
          tokenRef.current = null;
        },
        "error-callback": () => {
          tokenRef.current = null;
        },
        theme: "auto",
      });
    };

    // The script may already be loaded or still loading
    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [isPending]);

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

  return (
    <>
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
                  Hola, de Nuevo!
                </h1>
                <p className="text-muted-foreground text-sm">
                  Ingresa tus credenciales,{" "}
                  <span className="text-foreground hover:underline">
                    a continuacion.
                  </span>
                </p>
              </div>

              <form
                id="sign-in-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit().then(() => {
                    // Reset turnstile after each submit attempt
                    resetTurnstile();
                  });
                }}
                className="w-full"
              >
                <FieldGroup className="w-full">
                  <form.Field name="email">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid} className="w-full">
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Correo electrónico"
                            autoComplete="off"
                            className="w-full rounded-xl"
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>

                  <form.Field name="password">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid} className="w-full">
                          <PasswordInput className="rounded-xl">
                            <PasswordInputInput
                              placeholder="Contraseña"
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              autoComplete="off"
                            />

                            <PasswordInputAdornmentToggle />
                          </PasswordInput>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                </FieldGroup>

                {!isDev && (
                  <div className="flex justify-center mt-4">
                    <div ref={turnstileRef} />
                  </div>
                )}

                <div className="w-full mt-4">
                  <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <Button
                        type="submit"
                        className="w-full rounded-xl"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Ingresando..." : "Sign In"}
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </form>

              <p className="text-center text-xs w-full text-muted-foreground mt-2">
                You acknowledge that you read, and agree, to our{" "}
                <a href="#" className="underline hover:text-foreground">
                  Terms of Service
                </a>{" "}
                and our{" "}
                <a href="#" className="underline hover:text-foreground">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CookieConsent
        variant="default"
        onAcceptCallback={() => console.log("Accepted")}
        onDeclineCallback={() => console.log("Declined")}
      />
    </>
  );
};
