"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@shadcn/button";
import {
  Card,
  CardContent,
} from "@shadcn/card";
import { Field, FieldError, FieldGroup } from "@/core/shared/ui/shadcn/field";
import {
  PasswordInput,
  PasswordInputAdornmentToggle,
  PasswordInputInput,
} from "@/core/shared/ui/shadcn/password-input";
import Image from "next/image";
import { Routes } from "@/core/shared/constants/routes";
import { useResetPassword } from "../hooks/usePasswordReset";
import { showToast } from "@/core/shared/components/ShowToast";

export const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const { mutate: resetPassword, isPending } = useResetPassword();

  // Validate token exists
  useEffect(() => {
    if (!token) {
      showToast({
        type: "error",
        title: "Enlace inválido",
        description: "El enlace de restablecimiento es inválido o ha expirado.",
      });
      router.push(Routes.forgotPassword);
    }
  }, [token, router]);

  const validateNewPassword = (value: string): boolean => {
    if (!value) {
      setNewPasswordError("La contraseña es requerida");
      return false;
    }

    if (value.length < 8) {
      setNewPasswordError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }

    setNewPasswordError(null);
    return true;
  };

  const validateConfirmPassword = (value: string): boolean => {
    if (!value) {
      setConfirmPasswordError("Debes confirmar la contraseña");
      return false;
    }

    if (value !== newPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden");
      return false;
    }

    setConfirmPasswordError(null);
    return true;
  };

  const handleNewPasswordBlur = () => {
    setNewPasswordTouched(true);
    validateNewPassword(newPassword);
  };

  const handleConfirmPasswordBlur = () => {
    setConfirmPasswordTouched(true);
    validateConfirmPassword(confirmPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showToast({
        type: "error",
        title: "Error",
        description: "Token no encontrado",
      });
      return;
    }

    setNewPasswordTouched(true);
    setConfirmPasswordTouched(true);

    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    resetPassword(
      {
        newPassword,
        token,
      },
      {
        onSuccess: () => {
          // Redirect to sign-in after successful reset
          setTimeout(() => {
            router.push(Routes.signIn);
          }, 1500);
        },
      },
    );
  };

  const isNewPasswordInvalid = newPasswordTouched && newPasswordError !== null;
  const isConfirmPasswordInvalid = confirmPasswordTouched && confirmPasswordError !== null;

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
                Restablecer contraseña
              </h1>
              <p className="text-muted-foreground text-sm">
                Ingresa tu nueva contraseña para{" "}
                <span className="text-foreground">completar el restablecimiento.</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full">
              <FieldGroup className="w-full">
                <Field data-invalid={isNewPasswordInvalid} className="w-full">
                  <PasswordInput className="rounded-xl">
                    <PasswordInputInput
                      placeholder="Nueva contraseña"
                      id="newPassword"
                      name="newPassword"
                      value={newPassword}
                      onBlur={handleNewPasswordBlur}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (newPasswordTouched) {
                          validateNewPassword(e.target.value);
                        }
                        // Re-validate confirm password if it's been touched
                        if (confirmPasswordTouched && confirmPassword) {
                          setConfirmPasswordError(
                            e.target.value !== confirmPassword
                              ? "Las contraseñas no coinciden"
                              : null,
                          );
                        }
                      }}
                      aria-invalid={isNewPasswordInvalid}
                      autoComplete="new-password"
                      disabled={isPending}
                    />
                    <PasswordInputAdornmentToggle />
                  </PasswordInput>
                  {isNewPasswordInvalid && newPasswordError && (
                    <FieldError errors={[{ message: newPasswordError }]} />
                  )}
                </Field>

                <Field data-invalid={isConfirmPasswordInvalid} className="w-full">
                  <PasswordInput className="rounded-xl">
                    <PasswordInputInput
                      placeholder="Confirmar contraseña"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onBlur={handleConfirmPasswordBlur}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordTouched) {
                          validateConfirmPassword(e.target.value);
                        }
                      }}
                      aria-invalid={isConfirmPasswordInvalid}
                      autoComplete="new-password"
                      disabled={isPending}
                    />
                    <PasswordInputAdornmentToggle />
                  </PasswordInput>
                  {isConfirmPasswordInvalid && confirmPasswordError && (
                    <FieldError errors={[{ message: confirmPasswordError }]} />
                  )}
                </Field>
              </FieldGroup>

              <div className="w-full mt-6">
                <Button
                  type="submit"
                  className="w-full rounded-xl"
                  size="lg"
                  disabled={isPending}
                >
                  {isPending ? "Actualizando..." : "Restablecer contraseña"}
                </Button>
              </div>
            </form>

            <p className="text-center text-xs w-full text-muted-foreground mt-2">
              La contraseña debe tener al menos 8 caracteres.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
