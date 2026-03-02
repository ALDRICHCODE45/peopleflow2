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
import { HugeiconsIcon } from "@hugeicons/react";
import { FileAttachmentIcon, Delete02Icon } from "@hugeicons/core-free-icons";
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
  currentSalary: string;
  salaryExpectation: string;
  currentCommissions: string;
  currentBenefits: string;
  candidateCountryCode: string;
  candidateRegionCode: string;
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
  currentSalary: "",
  salaryExpectation: "",
  currentCommissions: "",
  currentBenefits: "",
  candidateCountryCode: "",
  candidateRegionCode: "",
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

export function AddCandidateDialog({
  open,
  onClose,
  vacancyId,
}: AddCandidateDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {}
  );

  const addCandidateMutation = useAddCandidate();

  // CV file state via useFileUpload hook
  const [{ files: cvFiles, errors: cvErrors }, { getInputProps, openFileDialog, removeFile: removeCv }] =
    useFileUpload({
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
    mutationFn: async ({ file, candidateId }: { file: File; candidateId: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      const ext = file.name.split(".").pop() ?? "pdf";
      const key = StorageKeys.candidateCV(vacancyId, candidateId, ext);
      const result = await uploadFileAction({
        formData,
        key,
        attachableType: "VACANCY_CANDIDATE" as import("@/core/generated/prisma/client").AttachableType,
        subType: "CV" as import("@/core/generated/prisma/client").AttachmentSubType,
        vacancyCandidateId: candidateId,
      });
      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
  });

  const handleChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
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
        currentSalary: form.currentSalary ? Number(form.currentSalary) : undefined,
        salaryExpectation: form.salaryExpectation ? Number(form.salaryExpectation) : undefined,
        currentCommissions: form.currentCommissions.trim() || undefined,
        currentBenefits: form.currentBenefits.trim() || undefined,
        otherBenefits: form.otherBenefits.trim() || undefined,
      },
    });

    // Upload CV if one was selected — after candidate exists in DB
    if (cvFile && candidate?.id) {
      try {
        await uploadCvMutation.mutateAsync({ file: cvFile, candidateId: candidate.id });
        showToast({ type: "success", title: "CV subido", description: "El CV fue adjuntado al candidato" });
      } catch {
        showToast({ type: "error", title: "CV no subido", description: "El candidato fue creado pero el CV no pudo subirse. Podés intentarlo desde el perfil del candidato." });
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
                      onChange={(e) => handleChange("firstName", e.target.value)}
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
                    onCheckedChange={(v) => handleChange("isCurrentlyEmployed", v)}
                  />
                </div>

                {form.isCurrentlyEmployed && (
                  <Field>
                    <FieldLabel>Empresa actual</FieldLabel>
                    <Input
                      placeholder="Nombre de la empresa"
                      value={form.currentCompany}
                      onChange={(e) => handleChange("currentCompany", e.target.value)}
                    />
                  </Field>
                )}

                <Field>
                  <FieldLabel>Modalidad actual</FieldLabel>
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
                    <FieldLabel>País (trabajo actual)</FieldLabel>
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
                    <FieldLabel>Estado/Ciudad (trabajo actual)</FieldLabel>
                    <RegionSelect
                      value={form.currentRegionCode}
                      countryCode={form.currentCountryCode}
                      onChange={(val) => handleChange("currentRegionCode", val)}
                      placeholder="Seleccionar estado"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* ── Sección 3: Compensación ──────────────────────────── */}
            <div>
              <SectionHeader title="Compensación" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Salario actual</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-7"
                        value={form.currentSalary}
                        onChange={(e) => handleChange("currentSalary", e.target.value)}
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Expectativa salarial</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-7"
                        value={form.salaryExpectation}
                        onChange={(e) =>
                          handleChange("salaryExpectation", e.target.value)
                        }
                      />
                    </div>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Comisiones actuales</FieldLabel>
                  <Textarea
                    placeholder="Describe las comisiones..."
                    value={form.currentCommissions}
                    onChange={(e) => handleChange("currentCommissions", e.target.value)}
                    rows={2}
                  />
                </Field>

                <Field>
                  <FieldLabel>Beneficios actuales</FieldLabel>
                  <Textarea
                    placeholder="Describe los beneficios..."
                    value={form.currentBenefits}
                    onChange={(e) => handleChange("currentBenefits", e.target.value)}
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
                      onChange={(val) => handleChange("candidateRegionCode", val)}
                      placeholder="Seleccionar estado"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Otros beneficios esperados</FieldLabel>
                  <Textarea
                    placeholder="Otros beneficios que espera recibir..."
                    value={form.otherBenefits}
                    onChange={(e) => handleChange("otherBenefits", e.target.value)}
                    rows={2}
                  />
                </Field>
              </div>
            </div>

            {/* ── Sección 5: CV ────────────────────────────────────── */}
            <div>
              <SectionHeader title="CV del candidato" />
              <div className="rounded-lg border p-3 space-y-2">
                {cvFile ? (
                  <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <HugeiconsIcon icon={FileAttachmentIcon} size={16} className="text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{cvFile.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({formatBytes(cvFile.size)})
                      </span>
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
                  <div>
                    <input {...getInputProps()} className="hidden" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={openFileDialog}
                    >
                      <HugeiconsIcon icon={FileAttachmentIcon} size={14} />
                      Adjuntar CV
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC o DOCX · Máx. 10 MB</p>
                    {cvErrors.length > 0 && (
                      <p className="text-xs text-destructive mt-1">{cvErrors[0]}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addCandidateMutation.isPending || uploadCvMutation.isPending}
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
