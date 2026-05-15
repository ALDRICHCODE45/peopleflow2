import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shadcn/alert-dialog";
import { Button } from "@shadcn/button";
import { Spinner } from "@/core/shared/ui/shadcn/spinner";

interface SendMeetingReportAlertDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const SendMeetingReportAlertDialog = ({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: SendMeetingReportAlertDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">
            ¿Enviar reporte de reunión?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Se enviará por correo el reporte de reunión con el estado actual de
            las vacantes a los administradores configurados. Esta acción puede
            tardar unos segundos en procesarse.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button asChild>
            <AlertDialogAction
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner />
                  Enviando...
                </div>
              ) : (
                "Enviar reporte"
              )}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
