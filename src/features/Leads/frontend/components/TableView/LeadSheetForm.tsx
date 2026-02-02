"use client";

import type { Lead } from "../../types";
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

const CreateLeadForm = dynamic(
  () =>
    import("./CreateLeadForm").then((mod) => ({
      default: mod.CreateLeadForm,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center p-8">
        <Spinner className="size-10" />
      </div>
    ),
  },
);

const EditLeadForm = dynamic(
  () =>
    import("./EditLeadForm").then((mod) => ({
      default: mod.EditLeadForm,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center p-8">
        <Spinner className="size-10" />
      </div>
    ),
  },
);

interface LeadSheetFormProps {
  lead?: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadSheetForm({
  lead,
  open,
  onOpenChange,
}: LeadSheetFormProps) {
  const isEditing = !!lead;

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
          <SheetTitle>{isEditing ? "Editar Lead" : "Nuevo Lead"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Modifica los datos del lead"
              : "Completa los datos para crear un nuevo lead"}
          </SheetDescription>
        </SheetHeader>
        <div className="p-4">
          {isEditing ? (
            <EditLeadForm lead={lead} onOpenChange={onOpenChange} />
          ) : (
            <CreateLeadForm onOpenChange={onOpenChange} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
