"use client";

import { Button } from "@shadcn/button";
import {
  Card,
  CardContent,
} from "@shadcn/card";
import Image from "next/image";
import { useVerifyOTPForm } from "../hooks/useVerifyOTPForm";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/core/shared/ui/shadcn/input-otp";
import { Spinner } from "@shadcn/spinner";

export const VerifyOTPPage = () => {
  const { form, email, attemptsRemaining, isResending, resendOTP } =
    useVerifyOTPForm();

  // Show loading while checking for email in session storage
  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-sm rounded-4xl">
          <CardContent className="p-6 pt-10 flex justify-center">
            <Spinner className="size-8 text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mask email for display (show first 3 chars + domain)
  const maskedEmail = email.replace(
    /^(.{3})(.*)(@.*)$/,
    (_, start, middle, domain) => `${start}${"*".repeat(Math.min(middle.length, 5))}${domain}`
  );

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
                Verificacion OTP
              </h1>
              <p className="text-muted-foreground text-sm">
                Ingresa el codigo de 6 digitos enviado a{" "}
                <span className="text-foreground font-medium">
                  {maskedEmail}
                </span>
              </p>
            </div>

            <form
              id="verify-otp-form"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="w-full"
            >
              <div className="flex flex-col items-center space-y-4">
                <form.Field name="otp">
                  {(field) => (
                    <InputOTP
                      maxLength={6}
                      value={field.state.value}
                      onChange={(value) => field.handleChange(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="size-12 text-lg" />
                        <InputOTPSlot index={1} className="size-12 text-lg" />
                        <InputOTPSlot index={2} className="size-12 text-lg" />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="size-12 text-lg" />
                        <InputOTPSlot index={4} className="size-12 text-lg" />
                        <InputOTPSlot index={5} className="size-12 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  )}
                </form.Field>

                {attemptsRemaining < 3 && (
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    Intentos restantes: {attemptsRemaining}
                  </p>
                )}
              </div>

              <div className="w-full mt-6">
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button
                      type="submit"
                      className="w-full rounded-xl"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Verificando..." : "Verificar Codigo"}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No recibiste el codigo?{" "}
                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={isResending}
                  className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? "Enviando..." : "Reenviar codigo"}
                </button>
              </p>
            </div>

            <p className="text-center text-xs w-full text-muted-foreground mt-2">
              El codigo expira en 5 minutos. Si no lo recibes, revisa tu carpeta
              de spam.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
