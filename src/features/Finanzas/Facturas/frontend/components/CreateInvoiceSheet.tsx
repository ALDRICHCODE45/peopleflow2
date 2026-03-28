"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { Spinner } from "@shadcn/spinner";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import dynamic from "next/dynamic";
import type { CreateInvoiceSheetProps } from "../types/invoice.types";

const loadingFallback = (
  <div className="flex justify-center items-center p-8">
    <Spinner className="size-10" />
  </div>
);

const CreateInvoiceForm = dynamic(
  () =>
    import("./CreateInvoiceForm").then((mod) => ({
      default: mod.CreateInvoiceForm,
    })),
  {
    ssr: false,
    loading: () => loadingFallback,
  },
);

export function CreateInvoiceSheet({
  open,
  onOpenChange,
}: CreateInvoiceSheetProps) {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="2xl"
        side={isMobile ? "bottom" : "right"}
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
      >
        <SheetHeader className="p-4 pb-3 space-y-3">
          <SheetTitle className="text-xl font-semibold">
            Crear Factura
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Completa los datos para generar una nueva factura
          </SheetDescription>
        </SheetHeader>

        <CreateInvoiceForm onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
