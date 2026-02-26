"use client";

import { useMemo } from "react";
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
import {
  Delete02Icon,
  PlusSignIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { useCreateVacancyForm } from "../hooks/useCreateVacancyForm";
import { VACANCY_MODALITY_LABELS } from "../types/vacancy.types";
import type { VacancyModality } from "../types/vacancy.types";
import { WorkSchedulePicker } from "./WorkSchedulePicker";

interface CreateVacancyFormProps {
  onClose: () => void;
}

export function CreateVacancyForm({ onClose }: CreateVacancyFormProps) {
  const {
    form,
    users,
    clients,
    saleType,
    checklist,
    sendNotification,
    setSendNotification,
    detailsModal,
    isSubmitting,
    handleClientChange,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
  } = useCreateVacancyForm({ onClose });

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name ?? u.email,
        avatar: u.avatar,
      })),
    [users],
  );

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: c.id,
        label: c.nombre,
      })),
    [clients],
  );

  const modalityOptions = (
    Object.entries(VACANCY_MODALITY_LABELS) as [VacancyModality, string][]
  ).map(([value, label]) => ({ value, label }));

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="basic" className="flex-1">
              Información Básica
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex-1">
              Requisitos (Checklist)
            </TabsTrigger>
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
                    {isEmpty && (
                      <FieldError>La posición es requerida</FieldError>
                    )}
                  </Field>
                );
              }}
            </form.Field>

            {/* Estado (read-only) */}
            <Field>
              <FieldLabel>Estado</FieldLabel>
              <div className="flex items-center h-9 px-3 border rounded-md bg-muted/50">
                <Badge variant="secondary">Quick Meeting</Badge>
              </div>
            </Field>

            {/* Tipo de Vacante (auto-calculated) */}
            <Field>
              <FieldLabel>Tipo de Vacante</FieldLabel>
              <div className="flex items-center h-9 px-3 border rounded-md bg-muted/50">
                <form.Subscribe selector={(s) => s.values.clientId}>
                  {(clientId) =>
                    clientId ? (
                      <Badge
                        variant={
                          saleType === "RECOMPRA" ? "default" : "outline"
                        }
                      >
                        {saleType}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )
                  }
                </form.Subscribe>
              </div>
            </Field>

            {/* Fecha de Asignación */}
            <form.Field name="assignedAt">
              {(field) => (
                <Field>
                  <FieldLabel>Fecha de Asignación *</FieldLabel>
                  <DatePicker
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    placeholder="Seleccionar fecha de asignación"
                  />
                </Field>
              )}
            </form.Field>

            {/* Fecha de Entrega */}
            <form.Field name="targetDeliveryDate">
              {(field) => (
                <Field>
                  <FieldLabel>Fecha de Entrega</FieldLabel>
                  <DatePicker
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    placeholder="Seleccionar fecha de entrega"
                  />
                </Field>
              )}
            </form.Field>

            {/* Reclutador */}
            <form.Field name="recruiterId">
              {(field) => {
                const isEmpty =
                  field.state.meta.isTouched && !field.state.value;
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
                            <AvatarFallback className="text-xs">
                              U
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{opt.label}</span>
                        </>
                      )}
                      renderSelected={(opt) => (
                        <span className="flex items-center gap-2 truncate">
                          <Avatar className="size-6">
                            <AvatarImage src={opt.avatar ?? ""} />
                            <AvatarFallback className="text-xs">
                              U
                            </AvatarFallback>
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
                const isEmpty =
                  field.state.meta.isTouched && !field.state.value;
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
                    {isEmpty && (
                      <FieldError>El cliente es requerido</FieldError>
                    )}
                  </Field>
                );
              }}
            </form.Field>

            {/* Botón para abrir Detalles */}
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={detailsModal.openModal}
            >
              <HugeiconsIcon icon={Settings01Icon} className="size-4" />
              Detalles de la vacante
            </Button>

            {/* Notificación al reclutador */}
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox
                id="send-notification"
                checked={sendNotification}
                onCheckedChange={(checked) =>
                  setSendNotification(checked === true)
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
          </TabsContent>

          {/* ── TAB 2: Requisitos (Checklist) ──────────────────────── */}
          <TabsContent value="checklist" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Agrega los requisitos que debe cumplir el candidato.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChecklistItem}
                className="gap-1.5"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
                Agregar Requisito
              </Button>
            </div>

            {checklist.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay requisitos aún.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addChecklistItem}
                  className="mt-2 gap-1.5"
                >
                  <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
                  Agregar el primero
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {checklist.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">
                      {index + 1}.
                    </span>
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateChecklistItem(index, e.target.value)
                      }
                      placeholder={`Requisito ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChecklistItem(index)}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cerrar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Vacante"}
          </Button>
        </div>
      </form>

      {/* ── Dialog: Detalles de la vacante ─────────────────────── */}
      <Dialog
        open={detailsModal.isOpen}
        onOpenChange={(open) => !open && detailsModal.closeModal()}
      >
        <DialogContent className="min-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la vacante</DialogTitle>
            <DialogDescription>
              Ingresa los detalles de la vacante a continuacion:
            </DialogDescription>
          </DialogHeader>

          <div className="w-full space-y-4 max-h-[40vh] overflow-y-auto">
            {/* Salario mínimo / máximo */}
            <div className="grid grid-cols-2 gap-3">
              <form.Field name="salaryMin">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Salario mínimo</FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder="0"
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="salaryMax">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Salario máximo</FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder="0"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

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
                    placeholder="React, TypeScript, Node.js, etc."
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
            <Button onClick={detailsModal.closeModal}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
