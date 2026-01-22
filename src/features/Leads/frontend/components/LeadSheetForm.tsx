"use client";

import type { Lead, LeadFormData } from "../types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import dynamic from "next/dynamic";
import { LoadingModalState } from "@/core/shared/components/LoadingModalState";

const LeadForm = dynamic(
  () =>
    import("./LeadForm").then((mod) => ({
      default: mod.LeadForm,
    })),
  {
    ssr: false,
    loading: () => <LoadingModalState />,
  }
);

interface LeadSheetFormProps {
  lead?: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LeadFormData) => Promise<{ error: string | null }>;
}

export function LeadSheetForm({
  lead,
  open,
  onOpenChange,
  onSubmit,
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
          <SheetTitle>
            {isEditing ? "Editar Lead" : "Nuevo Lead"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Modifica los datos del lead"
              : "Completa los datos para crear un nuevo lead"}
          </SheetDescription>
        </SheetHeader>
        <div className="p-4">
          <LeadForm
            lead={lead}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
            isEditing={isEditing}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
