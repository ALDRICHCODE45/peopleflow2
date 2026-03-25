"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shadcn/dialog";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Switch } from "@shadcn/switch";
import { CurrencyInput } from "@/core/shared/components/CurrencyInput";
import { Textarea } from "@shadcn/textarea";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { ScrollArea } from "@shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Field, FieldLabel, FieldError } from "@/core/shared/ui/shadcn/field";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@lib/utils";
import { PhoneInput } from "@/core/shared/components/phone-input";
import CountrySelect from "@/core/shared/components/CountrySelect";
import RegionSelect from "@/core/shared/components/RegionSelect";
import { useAddCandidate } from "../hooks/useVacancyDetailMutations";
import { uploadFileAction } from "@core/storage/actions/uploadFile.action";
import { StorageKeys } from "@core/storage/StorageKeys";
import {
  useFileUpload,
  formatBytes,
  type FileWithPreview,
} from "@/core/shared/hooks/use-upload-file";
import { showToast } from "@/core/shared/components/ShowToast";
import type { VacancyModality } from "../types/vacancy.types";
import { VACANCY_MODALITY_LABELS } from "../types/vacancy.types";

interface AddCandidateDialogProps {
  open: boolean;
  onClose: () => void;
  vacancyId: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isCurrentlyEmployed: boolean;
  currentCompany: string;
  currentModality: VacancyModality | "";
  currentCountryCode: string;
  currentRegionCode: string;
  workCity: string;
  currentSalary: string;
  salaryExpectation: string;
  currentCommissions: string;
  currentBenefits: string;
  candidateCountryCode: string;
  candidateRegionCode: string;
  candidateCity: string;
  otherBenefits: string;
}

const INITIAL_STATE: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  isCurrentlyEmployed: false,
  currentCompany: "",
  currentModality: "",
  currentCountryCode: "",
  currentRegionCode: "",
  workCity: "",
  currentSalary: "",
  salaryExpectation: "",
  currentCommissions: "",
  currentBenefits: "",
  candidateCountryCode: "",
  candidateRegionCode: "",
  candidateCity: "",
  otherBenefits: "",
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="space-y-1 mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <Separator />
    </div>
  );
}

function getFileTypeIconSrc(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "doc" || ext === "docx") return "/icons/microsoft-word.svg";
  return "/icons/pdf.svg";
}

export function AddCandidateDialog({
  open,
  onClose,
  vacancyId,
}: AddCandidateDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const addCandidateMutation = useAddCandidate();

  // CV file state via useFileUpload hook
  const [
    { files: cvFiles, isDragging: cvIsDragging, errors: cvErrors },
    {
      getInputProps,
      openFileDialog,
      removeFile: removeCv,
      handleDragEnter: cvDragEnter,
      handleDragLeave: cvDragLeave,
      handleDragOver: cvDragOver,
      handleDrop: cvDrop,
    },
  ] = useFileUpload({
    accept: ".pdf,.doc,.docx",
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onFilesAdded: (_added: FileWithPreview[]) => {
      // Just collect — upload happens after candidate creation
    },
  });

  const cvFile = cvFiles[0]?.file instanceof File ? cvFiles[0].file : null;

  // Separate mutation for CV upload (runs after candidate is created)
  const uploadCvMutation = useMutation({
    mutationFn: async ({
      file,
      candidateId,
    }: {
      file: File;
      candidateId: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      const ext = file.name.split(".").pop() ?? "pdf";
      const key = StorageKeys.candidateCV(vacancyId, candidateId, ext);
      const result = await uploadFileAction({
        formData,
        key,
        attachableType:
          "VACANCY_CANDIDATE" as import("@/core/generated/prisma/client").AttachableType,
        subType:
          "CV" as import("@/core/generated/prisma/client").AttachmentSubType,
        vacancyCandidateId: candidateId,
      });
      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
  });

  const handleChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
    }
    if (!form.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const candidate = await addCandidateMutation.mutateAsync({
      vacancyId,
      data: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        isCurrentlyEmployed: form.isCurrentlyEmployed,
        currentCompany: form.currentCompany.trim() || undefined,
        currentModality: form.currentModality || undefined,
        countryCode: form.currentCountryCode || undefined,
        regionCode: form.currentRegionCode || undefined,
        workCity: form.workCity.trim() || undefined,
        candidateCountryCode: form.candidateCountryCode || undefined,
        candidateRegionCode: form.candidateRegionCode || undefined,
        candidateCity: form.candidateCity.trim() || undefined,
        currentSalary: form.currentSalary
          ? Number(form.currentSalary)
          : undefined,
        salaryExpectation: form.salaryExpectation
          ? Number(form.salaryExpectation)
          : undefined,
        currentCommissions: form.currentCommissions.trim() || undefined,
        currentBenefits: form.currentBenefits.trim() || undefined,
        otherBenefits: form.otherBenefits.trim() || undefined,
      },
    });

    // Upload CV if one was selected — after candidate exists in DB
    if (cvFile && candidate?.id) {
      try {
        await uploadCvMutation.mutateAsync({
          file: cvFile,
          candidateId: candidate.id,
        });
        showToast({
          type: "success",
          title: "CV subido",
          description: "El CV fue adjuntado al candidato",
        });
      } catch {
        showToast({
          type: "error",
          title: "CV no subido",
          description:
            "El candidato fue creado pero el CV no pudo subirse. Podés intentarlo desde el perfil del candidato.",
        });
      }
    }

    setForm(INITIAL_STATE);
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setForm(INITIAL_STATE);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar candidato</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <div className="space-y-6 py-2 px-1 pr-4">
            {/* ── Sección 1: Datos personales ─────────────────────── */}
            <div>
              <SectionHeader title="Datos personales" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>
                      Nombre <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="Juan"
                      value={form.firstName}
                      onChange={(e) =>
                        handleChange("firstName", e.target.value)
                      }
                    />
                    {errors.firstName && (
                      <FieldError>{errors.firstName}</FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel>
                      Apellido <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="García"
                      value={form.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                    />
                    {errors.lastName && (
                      <FieldError>{errors.lastName}</FieldError>
                    )}
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Teléfono</FieldLabel>
                  <PhoneInput
                    value={form.phone}
                    onChange={(val) => handleChange("phone", val)}
                    defaultCountry="MX"
                  />
                </Field>
              </div>
            </div>

            {/* ── Sección 2: Situación laboral ────────────────────── */}
            <div>
              <SectionHeader title="Situación laboral" />
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm">¿Actualmente empleado?</span>
                  <Switch
                    checked={form.isCurrentlyEmployed}
                    onCheckedChange={(v) =>
                      handleChange("isCurrentlyEmployed", v)
                    }
                  />
                </div>

                <Field>
                  <FieldLabel>Empresa actual o última</FieldLabel>
                  <Input
                    placeholder="Nombre de la empresa"
                    value={form.currentCompany}
                    onChange={(e) =>
                      handleChange("currentCompany", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>Modalidad actual o última</FieldLabel>
                  <Select
                    value={form.currentModality}
                    onValueChange={(v) =>
                      handleChange("currentModality", v as VacancyModality | "")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(VACANCY_MODALITY_LABELS) as [
                          VacancyModality,
                          string,
                        ][]
                      ).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>País (trabajo actual o último)</FieldLabel>
                    <CountrySelect
                      value={form.currentCountryCode}
                      onChange={(val) => {
                        handleChange("currentCountryCode", val);
                        handleChange("currentRegionCode", "");
                      }}
                      priorityOptions={["MX"]}
                      placeholder="Seleccionar país"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>
                      Estado/Ciudad (trabajo actual o último)
                    </FieldLabel>
                    <RegionSelect
                      value={form.currentRegionCode}
                      countryCode={form.currentCountryCode}
                      onChange={(val) => handleChange("currentRegionCode", val)}
                      placeholder="Seleccionar estado"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Municipio o zona</FieldLabel>
                  <Input
                    placeholder="Ej. Tecámac, Polanco, San Pedro Garza..."
                    value={form.workCity}
                    onChange={(e) => handleChange("workCity", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* ── Sección 3: Compensación ──────────────────────────── */}
            <div>
              <SectionHeader title="Compensación" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Sueldo actual o último (bruto)</FieldLabel>
                    <CurrencyInput
                      value={form.currentSalary}
                      onChange={(value) => handleChange("currentSalary", value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Expectativa económica (bruto)</FieldLabel>
                    <CurrencyInput
                      value={form.salaryExpectation}
                      onChange={(value) =>
                        handleChange("salaryExpectation", value)
                      }
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>
                    Bonos / Comisiones (Últimas o Actuales)
                  </FieldLabel>
                  <Textarea
                    placeholder="Ej. 10% comisión, bono anual..."
                    value={form.currentCommissions}
                    onChange={(e) =>
                      handleChange("currentCommissions", e.target.value)
                    }
                    rows={2}
                  />
                </Field>

                <Field>
                  <FieldLabel>Prestaciones actuales o últimas</FieldLabel>
                  <Textarea
                    placeholder="Describe prestaciones (vales, SGMM, vacaciones, etc.)"
                    value={form.currentBenefits}
                    onChange={(e) =>
                      handleChange("currentBenefits", e.target.value)
                    }
                    rows={2}
                  />
                </Field>

                <Field>
                  <FieldLabel>Otros beneficios esperados</FieldLabel>
                  <Textarea
                    placeholder="Otros beneficios que espera recibir..."
                    value={form.otherBenefits}
                    onChange={(e) =>
                      handleChange("otherBenefits", e.target.value)
                    }
                    rows={2}
                  />
                </Field>
              </div>
            </div>

            {/* ── Sección 4: Ubicación del candidato ──────────────── */}
            <div>
              <SectionHeader title="Ubicación del candidato" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>País de residencia</FieldLabel>
                    <CountrySelect
                      value={form.candidateCountryCode}
                      onChange={(val) => {
                        handleChange("candidateCountryCode", val);
                        handleChange("candidateRegionCode", "");
                      }}
                      priorityOptions={["MX"]}
                      placeholder="Seleccionar país"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Estado/Ciudad de residencia</FieldLabel>
                    <RegionSelect
                      value={form.candidateRegionCode}
                      countryCode={form.candidateCountryCode}
                      onChange={(val) =>
                        handleChange("candidateRegionCode", val)
                      }
                      placeholder="Seleccionar estado"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Municipio o zona</FieldLabel>
                  <Input
                    placeholder="Ej. Tecámac, Polanco, San Pedro Garza..."
                    value={form.candidateCity}
                    onChange={(e) =>
                      handleChange("candidateCity", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            {/* ── Sección 5: CV ────────────────────────────────────── */}
            <div>
              <SectionHeader title="CV del candidato" />
              <input {...getInputProps()} className="hidden" />
              {cvFile ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={getFileTypeIconSrc(cvFile.name)}
                      alt=""
                      width={28}
                      height={28}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {cvFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(cvFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => removeCv(cvFiles[0]?.id ?? "")}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </Button>
                </div>
              ) : (
                <div
                  onDragEnter={cvDragEnter}
                  onDragLeave={cvDragLeave}
                  onDragOver={cvDragOver}
                  onDrop={cvDrop}
                  onClick={openFileDialog}
                  className={cn(
                    "rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
                    cvIsDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50",
                  )}
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <HugeiconsIcon
                      icon={Upload01Icon}
                      size={28}
                      strokeWidth={1.5}
                      className={cn(
                        "transition-colors",
                        cvIsDragging ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {cvIsDragging
                          ? "Soltá el archivo acá"
                          : "Arrastrá o hacé clic para subir el CV"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PDF, DOC o DOCX · Máx. 10 MB
                      </p>
                    </div>
                  </div>
                  {cvErrors.length > 0 && (
                    <p className="text-xs text-destructive text-center mt-2">
                      {cvErrors[0]}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              addCandidateMutation.isPending || uploadCvMutation.isPending
            }
          >
            {addCandidateMutation.isPending
              ? "Creando candidato..."
              : uploadCvMutation.isPending
                ? "Subiendo CV..."
                : "Agregar candidato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
