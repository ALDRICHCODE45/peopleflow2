"use client";

import type React from "react";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Textarea } from "@shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@shadcn/dialog";
import { Field, FieldError, FieldLabel } from "@/core/shared/ui/shadcn/field";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/shared/ui/shadcn/tabs";
import { Badge } from "@shadcn/badge";
import { Switch } from "@shadcn/switch";
import { Checkbox } from "@shadcn/checkbox";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";
import CountrySelect from "@/core/shared/components/CountrySelect";
import RegionSelect from "@/core/shared/components/RegionSelect";
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import {
  VACANCY_MODALITY_LABELS,
  VACANCY_SERVICE_TYPE_LABELS,
  VACANCY_SALARY_TYPE_LABELS,
  VACANCY_CURRENCY_LABELS,
} from "../types/vacancy.types";
import type {
  VacancyModality,
  VacancyServiceType,
  VacancySalaryType,
  VacancyCurrency,
} from "../types/vacancy.types";
import type { VacancyForm } from "../types/vacancy-form.types";
import { WorkSchedulePicker } from "./WorkSchedulePicker";
import { SalaryFields } from "./SalaryFields";

export interface VacancyFormFieldsProps {
  form: VacancyForm;
  userOptions: { value: string; label: string; avatar?: string | null }[];
  clientOptions: { value: string; label: string }[];
  canEditAssignedAt: boolean;
  canEditTargetDeliveryDate: boolean;
  currentStatus?: string; // shown read-only; defaults to "Quick Meeting" for new vacancies
  sendNotification?: boolean;
  setSendNotification?: (v: boolean) => void;
  showNotification?: boolean; // controls visibility of the notification checkbox
  detailsModalOpen: boolean;
  openDetailsModal: () => void;
  closeDetailsModal: () => void;
  handleClientChange: (clientId: string) => void;
  showChecklist?: boolean;
  checklistSlot?: React.ReactNode;
}

export function VacancyFormFields({
  form,
  userOptions,
  clientOptions,
  canEditAssignedAt,
  canEditTargetDeliveryDate,
  currentStatus = "Quick Meeting",
  sendNotification = false,
  setSendNotification,
  showNotification = true,
  detailsModalOpen,
  openDetailsModal,
  closeDetailsModal,
  handleClientChange,
  showChecklist = false,
  checklistSlot,
}: VacancyFormFieldsProps) {
  const serviceTypeOptions = (
    Object.entries(VACANCY_SERVICE_TYPE_LABELS) as [
      VacancyServiceType,
      string,
    ][]
  ).map(([value, label]) => ({ value, label }));

  const modalityOptions = (
    Object.entries(VACANCY_MODALITY_LABELS) as [VacancyModality, string][]
  ).map(([value, label]) => ({ value, label }));

  return (
    <>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="basic" className="flex-1">
            Información Básica
          </TabsTrigger>
          {showChecklist && (
            <TabsTrigger value="checklist" className="flex-1">
              Requisitos (Checklist)
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── TAB 1: Información Básica ─────────────────────────── */}
        <TabsContent value="basic" className="space-y-4">
          {/* Posición */}
          <form.Field name="position">
            {(field) => {
              const isEmpty =
                field.state.meta.isTouched && !field.state.value?.trim();
              return (
                <Field data-invalid={isEmpty}>
                  <FieldLabel htmlFor={field.name}>Posición *</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Ej. Desarrollador Senior"
                    aria-invalid={isEmpty}
                  />
                  {isEmpty && <FieldError>La posición es requerida</FieldError>}
                </Field>
              );
            }}
          </form.Field>

          {/* Estado (read-only) */}
          <Field>
            <FieldLabel>Estado</FieldLabel>
            <div className="flex items-center h-9 px-3 border rounded-md bg-muted/50">
              <Badge variant="secondary">{currentStatus}</Badge>
            </div>
          </Field>

          {/* Tipo de Servicio */}
          <form.Field name="serviceType">
            {(field) => {
              const isEmpty = field.state.meta.isTouched && !field.state.value;
              return (
                <Field data-invalid={isEmpty}>
                  <FieldLabel htmlFor={field.name}>
                    Tipo de Servicio *
                  </FieldLabel>
                  <Select
                    value={field.state.value || "none"}
                    onValueChange={(v) =>
                      field.handleChange(
                        v === "none" ? "" : (v as VacancyServiceType),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Selecciona el tipo de servicio
                      </SelectItem>
                      {serviceTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEmpty && (
                    <FieldError>El tipo de servicio es requerido</FieldError>
                  )}
                </Field>
              );
            }}
          </form.Field>

          {/* Fecha de Asignación */}
          <form.Field name="assignedAt">
            {(field) => (
              <Field>
                <FieldLabel>Fecha de Asignación *</FieldLabel>
                <DatePicker
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  placeholder="Seleccionar fecha de asignación"
                  disabled={!canEditAssignedAt}
                />
              </Field>
            )}
          </form.Field>

          {/* Fecha Tentativa de Entrega */}
          <form.Field name="targetDeliveryDate">
            {(field) => (
              <Field>
                <FieldLabel>Fecha Tentativa de Entrega</FieldLabel>
                <DatePicker
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  placeholder="Seleccionar fecha tentativa de entrega"
                  disabled={!canEditTargetDeliveryDate}
                />
              </Field>
            )}
          </form.Field>

          {/* Reclutador */}
          <form.Field name="recruiterId">
            {(field) => {
              const isEmpty = field.state.meta.isTouched && !field.state.value;
              return (
                <Field data-invalid={isEmpty}>
                  <FieldLabel htmlFor={field.name}>Reclutador *</FieldLabel>
                  <SearchableSelect
                    options={userOptions}
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    placeholder="Selecciona el reclutador"
                    searchPlaceholder="Buscar reclutador..."
                    renderOption={(opt) => (
                      <>
                        <Avatar className="size-6">
                          <AvatarImage src={opt.avatar ?? ""} />
                          <AvatarFallback className="text-xs">U</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{opt.label}</span>
                      </>
                    )}
                    renderSelected={(opt) => (
                      <span className="flex items-center gap-2 truncate">
                        <Avatar className="size-6">
                          <AvatarImage src={opt.avatar ?? ""} />
                          <AvatarFallback className="text-xs">U</AvatarFallback>
                        </Avatar>
                        {opt.label}
                      </span>
                    )}
                  />
                  {isEmpty && (
                    <FieldError>El reclutador es requerido</FieldError>
                  )}
                </Field>
              );
            }}
          </form.Field>

          {/* Cliente */}
          <form.Field name="clientId">
            {(field) => {
              const isEmpty = field.state.meta.isTouched && !field.state.value;
              return (
                <Field data-invalid={isEmpty}>
                  <FieldLabel htmlFor={field.name}>Cliente *</FieldLabel>
                  <SearchableSelect
                    options={clientOptions}
                    value={field.state.value}
                    onChange={(v) => handleClientChange(v)}
                    placeholder="Selecciona el cliente"
                    searchPlaceholder="Buscar cliente..."
                  />
                  {isEmpty && <FieldError>El cliente es requerido</FieldError>}
                </Field>
              );
            }}
          </form.Field>

          {/* Botón para abrir Detalles */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={openDetailsModal}
          >
            <HugeiconsIcon icon={Settings01Icon} className="size-4" />
            Detalles de la vacante
          </Button>

          {/* Notificación al reclutador */}
          {showNotification && (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox
                id="send-notification"
                checked={sendNotification}
                onCheckedChange={(checked) =>
                  setSendNotification?.(checked === true)
                }
                className="mt-0.5"
              />
              <div className="space-y-1">
                <label
                  htmlFor="send-notification"
                  className="text-sm font-medium cursor-pointer leading-none"
                >
                  Enviar notificación al reclutador
                </label>
                <p className="text-xs text-muted-foreground">
                  Se enviará un email al reclutador informándole de la nueva
                  vacante asignada
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: Requisitos (Checklist) ──────────────────────── */}
        {showChecklist && (
          <TabsContent value="checklist" className="space-y-4">
            {checklistSlot}
          </TabsContent>
        )}
      </Tabs>

      {/* ── Dialog: Detalles de la vacante ─────────────────────── */}
      <Dialog
        open={detailsModalOpen}
        onOpenChange={(open) => !open && closeDetailsModal()}
      >
        <DialogContent className="md:min-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Detalles de la vacante</DialogTitle>
            <DialogDescription>
              Ingresa los detalles de la vacante a continuacion:
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[40vh] overflow-y-auto space-y-4 overflow-x-hidden">
            {/* Moneda */}
            <form.Field name="currency">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Moneda</FieldLabel>
                  <Select
                    value={field.state.value || "none"}
                    onValueChange={(v) =>
                      field.handleChange(
                        v === "none" ? "" : (v as VacancyCurrency),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin moneda</SelectItem>
                      {(
                        Object.entries(VACANCY_CURRENCY_LABELS) as [
                          VacancyCurrency,
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
              )}
            </form.Field>

            {/* Tipo de Salario */}
            <form.Field name="salaryType">
              {(field) => (
                <Field>
                  <FieldLabel>Tipo de Salario</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as VacancySalaryType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo de salario" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(VACANCY_SALARY_TYPE_LABELS) as [
                          VacancySalaryType,
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
              )}
            </form.Field>

            {/* Salario condicional según tipo */}
            <SalaryFields form={form} />

            {/* Prestaciones */}
            <form.Field name="benefits">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Prestaciones</FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Seguro médico, vales de despensa, etc."
                    rows={2}
                  />
                </Field>
              )}
            </form.Field>

            {/* Herramientas */}
            <form.Field name="tools">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Herramientas</FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Celular, Laptop, etc.."
                    rows={2}
                  />
                </Field>
              )}
            </form.Field>

            {/* Comisiones/Bonos */}
            <form.Field name="commissions">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Comisiones / Bonos
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Describe las comisiones o bonos..."
                    rows={2}
                  />
                </Field>
              )}
            </form.Field>

            {/* Modalidad */}
            <form.Field name="modality">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Modalidad</FieldLabel>
                  <Select
                    value={field.state.value ?? "none"}
                    onValueChange={(v) =>
                      field.handleChange(
                        v === "none" ? undefined : (v as VacancyModality),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin modalidad</SelectItem>
                      {modalityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            {/* Horario */}
            <form.Field name="schedule">
              {(field) => (
                <Field>
                  <FieldLabel>Horario</FieldLabel>
                  <WorkSchedulePicker
                    value={field.state.value || undefined}
                    onChange={(v) => field.handleChange(v)}
                  />
                </Field>
              )}
            </form.Field>

            {/* País */}
            <form.Field name="countryCode">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>País</FieldLabel>
                  <CountrySelect
                    className="w-full"
                    value={field.state.value}
                    onChange={(value) => {
                      field.handleChange(value);
                      form.setFieldValue("regionCode", "");
                    }}
                    priorityOptions={["MX"]}
                    placeholder="Seleccionar país"
                  />
                </Field>
              )}
            </form.Field>

            {/* Estado/Región */}
            <form.Field name="regionCode">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Estado / Región</FieldLabel>
                  <RegionSelect
                    className="w-full"
                    value={field.state.value}
                    countryCode={form.getFieldValue("countryCode")}
                    onChange={(value) => field.handleChange(value)}
                    placeholder="Seleccionar región"
                  />
                </Field>
              )}
            </form.Field>

            {/* Requiere Psicometría */}
            <form.Field name="requiresPsychometry">
              {(field) => (
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name} className="cursor-pointer">
                      Requiere Psicometría
                    </FieldLabel>
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                  </div>
                </Field>
              )}
            </form.Field>
          </div>

          <DialogFooter>
            <Button onClick={closeDetailsModal}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
