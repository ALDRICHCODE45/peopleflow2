"use client";

import { useForm } from "@tanstack/react-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Input } from "@/core/shared/ui/shadcn/input";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { Field, FieldLabel } from "@/core/shared/ui/shadcn/field";
import { LoadingButton } from "@/core/shared/ui/shadcn/loading-button";

import type { ClientDTO, FiscalDataFormData } from "../types/client.types";

interface FiscalDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientDTO;
  onSubmit: (data: FiscalDataFormData) => void;
  isSubmitting?: boolean;
}

const DEFAULT_FISCAL_VALUES: FiscalDataFormData = {
  rfc: "",
  codigoPostalFiscal: "",
  nombreComercial: "",
  ubicacion: "",
  regimenFiscal: "",
  figura: "",
};

export function FiscalDataDialog({
  open,
  onOpenChange,
  client,
  onSubmit,
  isSubmitting = false,
}: FiscalDataDialogProps) {
  const form = useForm({
    defaultValues: {
      ...DEFAULT_FISCAL_VALUES,
      rfc: client.rfc ?? "",
      codigoPostalFiscal: client.codigoPostalFiscal ?? "",
      nombreComercial: client.nombreComercial ?? "",
      ubicacion: client.ubicacion ?? "",
      regimenFiscal: client.regimenFiscal ?? "",
      figura: client.figura ?? "",
    } satisfies FiscalDataFormData,
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
          return;
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Datos Fiscales</DialogTitle>
          <DialogDescription>
            Edita los datos fiscales de{" "}
            <span className="font-medium text-foreground">
              {client.nombre}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-2">
            {/* Row 1: RFC + Código Postal Fiscal */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="rfc">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>RFC</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value.toUpperCase().slice(0, 13),
                        )
                      }
                      onBlur={field.handleBlur}
                      placeholder="XAXX010101000"
                      maxLength={13}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="codigoPostalFiscal">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Código Postal Fiscal
                    </FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                        field.handleChange(val);
                      }}
                      onBlur={field.handleBlur}
                      placeholder="06600"
                      maxLength={5}
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            {/* Row 2: Nombre Comercial + Régimen Fiscal */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="nombreComercial">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Nombre Comercial
                    </FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Nombre comercial"
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="regimenFiscal">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Régimen Fiscal
                    </FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="General de Ley PM"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            {/* Row 3: Ubicación (full width) */}
            <form.Field name="ubicacion">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Ubicación</FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Dirección fiscal completa"
                    rows={2}
                  />
                </Field>
              )}
            </form.Field>

            {/* Row 4: Figura (full width) */}
            <form.Field name="figura">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Figura</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Persona Moral"
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Guardando..."
            >
              Guardar
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
