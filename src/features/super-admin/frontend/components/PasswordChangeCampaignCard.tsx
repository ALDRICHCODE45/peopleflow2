"use client";

import { useEffect, useState } from "react";
import { Button } from "@shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/shared/ui/shadcn/alert-dialog";
import { showToast } from "@/core/shared/components/ShowToast";
import {
  countPasswordChangeCampaignRecipientsAction,
  sendPasswordChangeCampaignAction,
  sendPasswordChangeTestEmailAction,
} from "@/features/super-admin/server/presentation/actions/passwordChangeCampaign.actions";

/**
 * Tarjeta de campania de cambio de contrasena.
 *
 * Permite al super-admin:
 *  - Enviar un correo de prueba (a un email hardcodeado en el server action)
 *    para ver como se ve el template antes de mandarlo masivo.
 *  - Enviar la campania completa a todos los usuarios activos del sistema.
 *
 * Los envios pasan por Inngest (cola con concurrency: 5, retries automaticos).
 */
export function PasswordChangeCampaignCard() {
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await countPasswordChangeCampaignRecipientsAction();
      if (cancelled) return;
      if (result.error) {
        showToast({
          type: "error",
          title: "Error",
          description: result.error,
        });
        setRecipientCount(0);
      } else {
        setRecipientCount(result.count);
      }
      setIsLoadingCount(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const result = await sendPasswordChangeTestEmailAction();
      if (result.error) {
        showToast({
          type: "error",
          title: "Error",
          description: result.error,
        });
      } else {
        showToast({
          type: "success",
          title: "Correo de prueba encolado",
          description:
            "Inngest procesará el envío en segundos. Revise la bandeja del destinatario de pruebas.",
        });
      }
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendCampaign = async () => {
    setIsSendingCampaign(true);
    setConfirmOpen(false);
    try {
      const result = await sendPasswordChangeCampaignAction();
      if (result.error) {
        showToast({
          type: "error",
          title: "Error",
          description: result.error,
        });
      } else {
        showToast({
          type: "success",
          title: "Campaña encolada",
          description: `Se encolaron ${result.enqueued ?? 0} correos. Inngest los procesará en segundo plano (máx. 5 simultáneos).`,
        });
      }
    } finally {
      setIsSendingCampaign(false);
    }
  };

  return (
    <>
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">
            Campaña: Cambio de contraseña
          </CardTitle>
          <CardDescription className="text-purple-200">
            Invita a todos los usuarios activos del sistema a actualizar su
            contraseña. El correo NO incluye un token — solo enlaza a
            /forgot-password para que el usuario inicie el flujo estándar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-purple-200">
              {isLoadingCount ? (
                <span>Calculando destinatarios...</span>
              ) : (
                <>
                  Destinatarios activos:{" "}
                  <span className="font-semibold text-white">
                    {recipientCount}
                  </span>{" "}
                  usuarios (excluye bloqueados y sin email).
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={isSendingTest || isSendingCampaign}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                {isSendingTest ? "Encolando..." : "Enviar correo de prueba"}
              </Button>

              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={
                  isSendingTest ||
                  isSendingCampaign ||
                  isLoadingCount ||
                  (recipientCount ?? 0) === 0
                }
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSendingCampaign
                  ? "Encolando..."
                  : "Enviar campaña a todos"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmar envío masivo
            </AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de encolar un correo de cambio de contraseña para{" "}
              <span className="font-semibold">
                {recipientCount} usuario{recipientCount === 1 ? "" : "s"}
              </span>
              . Esta acción no se puede revertir.
              <br />
              <br />
              Inngest procesará los envíos en segundo plano con un máximo de 5
              correos simultáneos para no saturar el servidor SMTP. Puede seguir
              usando el sistema mientras se procesa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingCampaign}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendCampaign}
              disabled={isSendingCampaign}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSendingCampaign ? "Encolando..." : "Sí, enviar a todos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
