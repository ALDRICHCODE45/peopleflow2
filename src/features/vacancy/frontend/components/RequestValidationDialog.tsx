"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@shadcn/dialog";
import { Button } from "@shadcn/button";
import { Checkbox } from "@/core/shared/ui/shadcn/checkbox";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
import { showToast } from "@/core/shared/components/ShowToast";
import { requestValidationAction } from "../../server/presentation/actions/requestValidation.action";
import type { VacancyDTO, AttachmentDTO, VacancyChecklistItemDTO, VacancyCandidateDTO } from "../types/vacancy.types";

type ValidationResource =
  | "JOB_DESCRIPTION"
  | "PERFIL_MUESTRA"
  | "CHECKLIST"
  | "TERNA";

interface ResourceOption {
  key: ValidationResource;
  label: string;
  hint: string;
}

interface RequestValidationDialogProps {
  open: boolean;
  onClose: () => void;
  vacancy: VacancyDTO;
  attachments: AttachmentDTO[];
}

function buildResourceOptions(
  vacancy: VacancyDTO,
  attachments: AttachmentDTO[],
): ResourceOption[] {
  const jdCount = attachments.filter((a) => a.subType === "JOB_DESCRIPTION").length;
  const perfilCount = attachments.filter((a) => a.subType === "PERFIL_MUESTRA").length;
  const checklistItems: VacancyChecklistItemDTO[] = vacancy.checklistItems ?? [];
  const candidates: VacancyCandidateDTO[] = vacancy.candidates ?? [];
  const ternaCandidates = candidates.filter((c) => c.isInTerna);

  return [
    {
      key: "JOB_DESCRIPTION",
      label: "Job Description",
      hint: jdCount > 0 ? `${jdCount} archivo${jdCount !== 1 ? "s" : ""} subido${jdCount !== 1 ? "s" : ""}` : "Sin archivos",
    },
    {
      key: "PERFIL_MUESTRA",
      label: "Perfiles Muestra",
      hint: perfilCount > 0 ? `${perfilCount} archivo${perfilCount !== 1 ? "s" : ""} subido${perfilCount !== 1 ? "s" : ""}` : "Sin archivos",
    },
    {
      key: "CHECKLIST",
      label: "Checklist",
      hint: checklistItems.length > 0 ? `${checklistItems.length} requisito${checklistItems.length !== 1 ? "s" : ""}` : "Sin requisitos",
    },
    {
      key: "TERNA",
      label: "Terna (candidatos)",
      hint: ternaCandidates.length > 0
        ? `${ternaCandidates.length} candidato${ternaCandidates.length !== 1 ? "s" : ""} en terna`
        : candidates.length > 0
          ? `${candidates.length} candidato${candidates.length !== 1 ? "s" : ""}`
          : "Sin candidatos",
    },
  ];
}

export function RequestValidationDialog({
  open,
  onClose,
  vacancy,
  attachments,
}: RequestValidationDialogProps) {
  const [selected, setSelected] = useState<Set<ValidationResource>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resourceOptions = buildResourceOptions(vacancy, attachments);

  function toggleResource(key: ValidationResource) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) return;

    setIsSubmitting(true);
    try {
      const result = await requestValidationAction({
        vacancyId: vacancy.id,
        resources: Array.from(selected),
      });

      if (result.error) {
        showToast({
          type: "error",
          title: "Error",
          description: result.error,
        });
        return;
      }

      showToast({
        type: "success",
        title: "Solicitud enviada",
        description: "Se notificó a los usuarios configurados para validación.",
      });

      setSelected(new Set());
      onClose();
    } catch {
      showToast({
        type: "error",
        title: "Error",
        description: "Error inesperado al enviar la solicitud.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelected(new Set());
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar validación</DialogTitle>
          <DialogDescription>
            Seleccioná los recursos que querés que sean validados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {resourceOptions.map((option) => (
            <label
              key={option.key}
              className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selected.has(option.key)}
                onCheckedChange={() => toggleResource(option.key)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{option.label}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.hint}
                </p>
              </div>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.size === 0 || isSubmitting}
            className="gap-1.5"
          >
            <HugeiconsIcon icon={SentIcon} size={14} strokeWidth={2} />
            {isSubmitting ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
