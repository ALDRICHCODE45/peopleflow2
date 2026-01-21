"use client";

import type { Vacancy, VacancyStatus } from "../types/vacancy.types";
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

const VacancyForm = dynamic(
  () =>
    import("./VacancyForm").then((mod) => ({
      default: mod.VacancyForm,
    })),
  {
    ssr: false,
    loading: () => <LoadingModalState />,
  },
);

interface VacancyFormProps {
  vacancy?: Vacancy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description: string;
    status?: VacancyStatus;
    department?: string;
    location?: string;
  }) => Promise<{ error: string | null }>;
}

export function VacancySheetForm({
  vacancy,
  open,
  onOpenChange,
  onSubmit,
}: VacancyFormProps) {
  const isEditing = !!vacancy;

  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="xl"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B]"
        side={sheetSide}
      >
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Editar Vacante" : "Nueva Vacante"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Modifica los datos de la vacante"
              : "Completa los datos para crear una nueva vacante"}
          </SheetDescription>
        </SheetHeader>
        <div className="p-4">
          <VacancyForm
            vacancy={vacancy}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
            isEditing={isEditing}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
