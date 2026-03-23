"use client";

import type { ClientDTO } from "../types/client.types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import dynamic from "next/dynamic";
import { Spinner } from "@shadcn/spinner";

const loadingFallback = (
  <div className="flex justify-center items-center p-8">
    <Spinner className="size-10" />
  </div>
);

const EditClientForm = dynamic(
  () =>
    import("./EditClientForm").then((mod) => ({
      default: mod.EditClientForm,
    })),
  {
    ssr: false,
    loading: () => loadingFallback,
  },
);

interface ClientSheetFormProps {
  client: ClientDTO | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientSheetForm({
  client,
  open,
  onOpenChange,
}: ClientSheetFormProps) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="xl"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto"
        side={sheetSide}
      >
        <SheetHeader>
          <SheetTitle>Editar Cliente</SheetTitle>
          <SheetDescription>
            Modifica los datos de{" "}
            <span className="font-medium text-foreground">
              {client?.nombre}
            </span>
          </SheetDescription>
        </SheetHeader>
        <div className="p-4">
          {client && (
            <EditClientForm
              client={client}
              onClose={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
