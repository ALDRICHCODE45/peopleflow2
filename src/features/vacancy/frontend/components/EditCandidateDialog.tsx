"use client";

import { useState } from "react";
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
import { PhoneInput } from "@/core/shared/components/phone-input";
import CountrySelect from "@/core/shared/components/CountrySelect";
import RegionSelect from "@/core/shared/components/RegionSelect";
import { useUpdateCandidate } from "../hooks/useVacancyDetailMutations";
import type {
  VacancyCandidateDTO,
  VacancyModality,
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-7"
                        value={form.currentSalary}
                        onChange={(e) =>
                          handleChange("currentSalary", e.target.value)
                        }
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
