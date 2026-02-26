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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Field, FieldLabel, FieldError } from "@/core/shared/ui/shadcn/field";
import { useAddCandidate } from "../hooks/useVacancyDetailMutations";
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
  salaryExpectation: string;
  currentSalary: string;
  isCurrentlyEmployed: boolean;
  currentCompany: string;
  currentModality: VacancyModality | "";
}

const INITIAL_STATE: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  salaryExpectation: "",
  currentSalary: "",
  isCurrentlyEmployed: false,
  currentCompany: "",
  currentModality: "",
};

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

    await addCandidateMutation.mutateAsync({
      vacancyId,
      data: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        salaryExpectation: form.salaryExpectation
          ? Number(form.salaryExpectation)
          : undefined,
        currentSalary: form.currentSalary
          ? Number(form.currentSalary)
          : undefined,
        isCurrentlyEmployed: form.isCurrentlyEmployed,
        currentCompany: form.currentCompany.trim() || undefined,
        currentModality: form.currentModality || undefined,
      },
    });

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar candidato</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Nombre y Apellido */}
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

          {/* Email y Teléfono */}
          <div className="grid grid-cols-2 gap-3">
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
              <Input
                placeholder="+52 555 000 0000"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </Field>
          </div>

          {/* Salario expectativa y actual */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Expectativa salarial</FieldLabel>
              <Input
                type="number"
                placeholder="0"
                value={form.salaryExpectation}
                onChange={(e) =>
                  handleChange("salaryExpectation", e.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel>Salario actual</FieldLabel>
              <Input
                type="number"
                placeholder="0"
                value={form.currentSalary}
                onChange={(e) => handleChange("currentSalary", e.target.value)}
              />
            </Field>
          </div>

          {/* Empleado actualmente */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="text-sm">¿Actualmente empleado?</span>
            <Switch
              checked={form.isCurrentlyEmployed}
              onCheckedChange={(v) => handleChange("isCurrentlyEmployed", v)}
            />
          </div>

          {/* Empresa actual */}
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

          {/* Modalidad actual */}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addCandidateMutation.isPending}
          >
            {addCandidateMutation.isPending ? "Agregando..." : "Agregar candidato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
