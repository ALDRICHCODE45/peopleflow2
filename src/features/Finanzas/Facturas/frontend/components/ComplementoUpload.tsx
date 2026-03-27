"use client";

import { useRef } from "react";
import { Button } from "@shadcn/button";
import { useUploadInvoiceComplemento } from "../hooks/useUploadInvoiceComplemento";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileUploadIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Spinner } from "@shadcn/spinner";

interface ComplementoUploadProps {
  invoiceId: string;
  hasComplemento: boolean;
  disabled?: boolean;
}

/**
 * Upload component for PPD complemento PDF files.
 * Shows upload button or current complemento status.
 */
export function ComplementoUpload({
  invoiceId,
  hasComplemento,
  disabled = false,
}: ComplementoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadInvoiceComplemento();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    await uploadMutation.mutateAsync({
      formData,
      invoiceId,
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (hasComplemento) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-3">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          className="size-5 text-green-600 dark:text-green-400"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            Complemento subido
          </p>
          <p className="text-xs text-muted-foreground">
            El complemento de pago fue adjuntado correctamente
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          Reemplazar
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
        <HugeiconsIcon
          icon={FileUploadIcon}
          className="size-5 text-amber-600 dark:text-amber-400"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Complemento requerido
          </p>
          <p className="text-xs text-muted-foreground">
            Esta factura PPD requiere un complemento de pago para marcarse como
            pagada
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={disabled || uploadMutation.isPending}
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        {uploadMutation.isPending ? (
          <>
            <Spinner className="size-4 mr-2" />
            Subiendo...
          </>
        ) : (
          <>
            <HugeiconsIcon icon={FileUploadIcon} className="size-4 mr-2" />
            Subir complemento (PDF)
          </>
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
