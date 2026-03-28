"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { Badge } from "@shadcn/badge";
import { Spinner } from "@shadcn/spinner";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import dynamic from "next/dynamic";
import {
  InvoiceTypeLabels,
  InvoicePaymentTypeLabels,
  InvoiceStatusLabels,
} from "../types/invoice.types";
import type { EditInvoiceSheetProps } from "../types/invoice.types";

const loadingFallback = (
  <div className="flex justify-center items-center p-8">
    <Spinner className="size-10" />
  </div>
);

const EditInvoiceForm = dynamic(
  () =>
    import("./EditInvoiceForm").then((mod) => ({
      default: mod.EditInvoiceForm,
    })),
  {
    ssr: false,
    loading: () => loadingFallback,
  },
);

export function EditInvoiceSheet({
  invoice,
  open,
  onOpenChange,
}: EditInvoiceSheetProps) {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="2xl"
        side={isMobile ? "bottom" : "right"}
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
      >
        <SheetHeader className="p-4 pb-3 space-y-3">
          <SheetTitle className="flex items-center gap-2 text-xl font-semibold">
            Editar Factura {invoice.folio}
            <Badge variant="secondary">
              {InvoiceTypeLabels[invoice.type] ?? invoice.type}
            </Badge>
            <Badge
              variant={invoice.status === "PAGADA" ? "default" : "outline"}
            >
              {InvoiceStatusLabels[invoice.status] ?? invoice.status}
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {InvoicePaymentTypeLabels[invoice.paymentType] ?? invoice.paymentType}
            {" · "}
            {invoice.clientName ?? invoice.razonSocial ?? "Sin cliente"}
          </SheetDescription>
        </SheetHeader>

        <EditInvoiceForm
          invoice={invoice}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
