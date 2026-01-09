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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/shared/ui/shadcn/field";
import {
  PasswordInput,
  PasswordInputAdornmentToggle,
  PasswordInputInput,
} from "@/core/shared/ui/shadcn/password-input";

export const SignInPage = () => {
  const { isPending } = useAuth();
  const form = useSignInForm();

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
                form.handleSubmit();
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
                            onChange={(e) => field.handleChange(e.target.value)}
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

              <div className="w-full mt-6">
                <Button type="submit" className="w-full rounded-xl" size="lg">
                  Sign In
                </Button>
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
  );
};
