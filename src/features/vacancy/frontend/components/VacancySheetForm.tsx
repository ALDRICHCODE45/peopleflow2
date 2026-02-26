"use client";

import type { VacancyDTO } from "../types/vacancy.types";
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

const CreateVacancyForm = dynamic(
  () =>
    import("./CreateVacancyForm").then((mod) => ({
      default: mod.CreateVacancyForm,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center p-8">
        <Spinner className="size-10" />
      </div>
    ),
  }
);

interface VacancySheetFormProps {
  vacancy?: VacancyDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VacancySheetForm({
  vacancy,
  open,
  onOpenChange,
}: VacancySheetFormProps) {
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
            {vacancy ? "Editar Vacante" : "Nueva Vacante"}
          </SheetTitle>
          <SheetDescription>
            {vacancy
              ? "Modifica los datos de la vacante"
              : "Completa los datos para crear una nueva vacante"}
          </SheetDescription>
        </SheetHeader>
        <div className="p-4">
          <CreateVacancyForm onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
