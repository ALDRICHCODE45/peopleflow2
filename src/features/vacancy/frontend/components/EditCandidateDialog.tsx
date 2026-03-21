"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shadcn/dropdown-menu";
import { Field, FieldLabel, FieldError } from "@/core/shared/ui/shadcn/field";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  Delete02Icon,
  MoreVerticalIcon,
  Download04Icon,
  ArrowMoveUpLeftIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@lib/utils";
import { PhoneInput } from "@/core/shared/components/phone-input";
import CountrySelect from "@/core/shared/components/CountrySelect";
import RegionSelect from "@/core/shared/components/RegionSelect";
import { useUpdateCandidate } from "../hooks/useVacancyDetailMutations";
import { useDeleteVacancyAttachment } from "../hooks/useVacancyAttachments";
import { uploadFileAction } from "@core/storage/actions/uploadFile.action";
import { StorageKeys } from "@core/storage/StorageKeys";
import {
  useFileUpload,
  type FileWithPreview,
} from "@/core/shared/hooks/use-upload-file";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import type {
  VacancyCandidateDTO,
  VacancyModality,
  AttachmentDTO,
} from "../types/vacancy.types";
import { VACANCY_MODALITY_LABELS } from "../types/vacancy.types";

interface EditCandidateDialogProps {
  open: boolean;
  onClose: () => void;
  candidate: VacancyCandidateDTO;
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

function candidateToFormState(candidate: VacancyCandidateDTO): FormState {
  return {
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email ?? "",
    phone: candidate.phone ?? "",
    isCurrentlyEmployed: candidate.isCurrentlyEmployed ?? false,
    currentCompany: candidate.currentCompany ?? "",
    currentModality: candidate.currentModality ?? "",
    currentCountryCode: candidate.countryCode ?? "",
    currentRegionCode: candidate.regionCode ?? "",
    currentSalary:
      candidate.currentSalary != null ? String(candidate.currentSalary) : "",
    salaryExpectation:
      candidate.salaryExpectation != null
        ? String(candidate.salaryExpectation)
        : "",
    currentCommissions: candidate.currentCommissions ?? "",
    currentBenefits: candidate.currentBenefits ?? "",
    candidateCountryCode: "",
    candidateRegionCode: "",
    otherBenefits: candidate.otherBenefits ?? "",
  };
}

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EditCandidateDialog({
  open,
  onClose,
  candidate,
  vacancyId,
}: EditCandidateDialogProps) {
  const [form, setForm] = useState<FormState>(() =>
    candidateToFormState(candidate),
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const updateCandidateMutation = useUpdateCandidate();
  const deleteAttachmentMutation = useDeleteVacancyAttachment(vacancyId);
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  // ── CV state ──────────────────────────────────────────────────────────────
  const existingCv = useMemo<AttachmentDTO | null>(
    () => candidate.attachments?.find((a) => a.subType === "CV") ?? null,
    [candidate.attachments],
  );

  const [
    { files: cvFiles, isDragging: cvIsDragging, errors: cvErrors },
    {
      getInputProps: getCvInputProps,
      openFileDialog: openCvDialog,
      clearFiles: clearCvFiles,
      handleDragEnter: cvDragEnter,
      handleDragLeave: cvDragLeave,
      handleDragOver: cvDragOver,
      handleDrop: cvDrop,
    },
  ] = useFileUpload({
    accept: ".pdf,.doc,.docx",
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onFilesAdded: (added: FileWithPreview[]) => {
      const first = added[0];
      if (first && first.file instanceof File) {
        uploadCvMutation.mutate({ file: first.file });
      }
    },
  });

  const pendingCvFile =
    cvFiles[0]?.file instanceof File ? cvFiles[0].file : null;

  const uploadCvMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const ext = file.name.split(".").pop() ?? "pdf";
      const key = StorageKeys.candidateCV(vacancyId, candidate.id, ext);
      const result = await uploadFileAction({
        formData,
        key,
        attachableType:
          "VACANCY_CANDIDATE" as import("@/core/generated/prisma/client").AttachableType,
        subType:
          "CV" as import("@/core/generated/prisma/client").AttachmentSubType,
        vacancyCandidateId: candidate.id,
      });
      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "CV subido",
        description: "El CV fue adjuntado al candidato",
      });
      clearCvFiles();
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, vacancyId),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error al subir CV",
        description: error.message ?? "No se pudo subir el CV",
      });
      clearCvFiles();
    },
  });

  const handleDeleteCv = async (attachmentId: string) => {
    await deleteAttachmentMutation.mutateAsync(attachmentId);
  };

  const handleReplaceCv = (attachmentId: string) => {
    // Delete old first, then open file dialog to pick a new one
    deleteAttachmentMutation.mutate(attachmentId, {
      onSuccess: () => {
        openCvDialog();
      },
    });
  };

  const handleDownloadCv = (url: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

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

    await updateCandidateMutation.mutateAsync({
      candidateId: candidate.id,
      vacancyId,
      data: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        isCurrentlyEmployed: form.isCurrentlyEmployed,
        currentCompany: form.currentCompany.trim() || null,
        currentModality: form.currentModality || null,
        countryCode: form.currentCountryCode || null,
        regionCode: form.currentRegionCode || null,
        currentSalary: form.currentSalary ? Number(form.currentSalary) : null,
        salaryExpectation: form.salaryExpectation
          ? Number(form.salaryExpectation)
          : null,
        currentCommissions: form.currentCommissions.trim() || null,
        currentBenefits: form.currentBenefits.trim() || null,
        otherBenefits: form.otherBenefits.trim() || null,
      },
    });

    onClose();
  };

  const handleClose = () => {
    setForm(candidateToFormState(candidate));
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar candidato</DialogTitle>
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
                      onChange={(e) =>
                        handleChange("currentCompany", e.target.value)
                      }
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
                    <CurrencyInput
                      value={form.currentSalary}
                      onChange={(value) =>
                        handleChange("currentSalary", value)
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Expectativa salarial</FieldLabel>
                    <CurrencyInput
                      value={form.salaryExpectation}
                      onChange={(value) =>
                        handleChange("salaryExpectation", value)
                      }
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Comisiones actuales</FieldLabel>
                  <Textarea
                    placeholder="Describe las comisiones..."
                    value={form.currentCommissions}
                    onChange={(e) =>
                      handleChange("currentCommissions", e.target.value)
                    }
                    rows={2}
                  />
                </Field>

                <Field>
                  <FieldLabel>Beneficios actuales</FieldLabel>
                  <Textarea
                    placeholder="Describe los beneficios..."
                    value={form.currentBenefits}
                    onChange={(e) =>
                      handleChange("currentBenefits", e.target.value)
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
              <input {...getCvInputProps()} className="hidden" />

              {/* Uploading indicator */}
              {uploadCvMutation.isPending && pendingCvFile && (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={getFileTypeIconSrc(pendingCvFile.name)}
                      alt=""
                      width={28}
                      height={28}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {pendingCvFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Subiendo...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing CV attached */}
              {!uploadCvMutation.isPending && existingCv && (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={getFileTypeIconSrc(existingCv.fileName)}
                      alt=""
                      width={28}
                      height={28}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {existingCv.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(existingCv.fileSize)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                      >
                        <HugeiconsIcon icon={MoreVerticalIcon} size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleDownloadCv(existingCv.fileUrl, existingCv.fileName)
                        }
                      >
                        <HugeiconsIcon icon={Download04Icon} size={14} className="mr-2" />
                        Descargar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleReplaceCv(existingCv.id)}
                        disabled={deleteAttachmentMutation.isPending}
                      >
                        <HugeiconsIcon icon={ArrowMoveUpLeftIcon} size={14} className="mr-2" />
                        Reemplazar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCv(existingCv.id)}
                        disabled={deleteAttachmentMutation.isPending}
                        className="text-destructive focus:text-destructive"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} className="mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* No CV — show drop zone */}
              {!uploadCvMutation.isPending && !existingCv && (
                <div
                  onDragEnter={cvDragEnter}
                  onDragLeave={cvDragLeave}
                  onDragOver={cvDragOver}
                  onDrop={cvDrop}
                  onClick={openCvDialog}
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
            disabled={updateCandidateMutation.isPending}
          >
            {updateCandidateMutation.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
