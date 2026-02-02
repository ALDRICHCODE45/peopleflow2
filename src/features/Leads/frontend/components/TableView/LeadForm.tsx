"use client";

import { useState, useEffect } from "react";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Label } from "@shadcn/label";
import { Textarea } from "@shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import type { Lead, LeadFormData, LeadStatus } from "../../types";
import { LEAD_EMPLOYEE_OPTIONS, LEAD_STATUS_OPTIONS } from "../../types";
import {
  useSectors,
  useSubsectorsBySector,
  useLeadOrigins,
} from "../../hooks/useCatalogs";

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: LeadFormData) => Promise<{ error: string | null }>;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
}

export function LeadForm({
  lead,
  onSubmit,
  onOpenChange,
  isEditing,
}: LeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState<string | undefined>(
    lead?.sectorId ?? undefined
  );

  const { data: sectors = [] } = useSectors();
  const { data: subsectors = [] } = useSubsectorsBySector(
    selectedSectorId ?? null
  );
  const { data: origins = [] } = useLeadOrigins();

  const [formData, setFormData] = useState({
    companyName: lead?.companyName ?? "",
    website: lead?.website ?? "",
    linkedInUrl: lead?.linkedInUrl ?? "",
    address: lead?.address ?? "",
    subOrigin: lead?.subOrigin ?? "",
    employeeCount: lead?.employeeCount ?? "",
    notes: lead?.notes ?? "",
    status: lead?.status ?? "CONTACTO",
    sectorId: lead?.sectorId ?? undefined,
    subsectorId: lead?.subsectorId ?? undefined,
    originId: lead?.originId ?? undefined,
  });

  // Reset subsector when sector changes
  useEffect(() => {
    if (selectedSectorId !== lead?.sectorId) {
      setFormData((prev) => ({ ...prev, subsectorId: undefined }));
    }
  }, [selectedSectorId, lead?.sectorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const finalData = {
      ...formData,
      assignedToId: "jkj",
    };

    try {
      const result = await onSubmit(finalData);
      if (!result.error) {
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    field: keyof LeadFormData,
    value: string | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "sectorId") {
      setSelectedSectorId(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre de la empresa */}
      <div className="space-y-2">
        <Label htmlFor="companyName">Nombre de la empresa *</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => handleChange("companyName", e.target.value)}
          placeholder="Nombre de la empresa"
          required
        />
      </div>

      {/* Estado (solo en edición) */}
      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              handleChange("status", value as LeadStatus)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sector y Subsector */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sectorId">Sector</Label>
          <Select
            value={formData.sectorId ?? "none"}
            onValueChange={(value) =>
              handleChange("sectorId", value === "none" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin sector</SelectItem>
              {sectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subsectorId">Subsector</Label>
          <Select
            value={formData.subsectorId ?? "none"}
            onValueChange={(value) =>
              handleChange("subsectorId", value === "none" ? undefined : value)
            }
            disabled={!selectedSectorId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un subsector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin subsector</SelectItem>
              {subsectors.map((subsector) => (
                <SelectItem key={subsector.id} value={subsector.id}>
                  {subsector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Origen */}
      <div className="space-y-2">
        <Label htmlFor="originId">Origen del lead</Label>
        <Select
          value={formData.originId ?? "none"}
          onValueChange={(value) =>
            handleChange("originId", value === "none" ? undefined : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin origen</SelectItem>
            {origins.map((origin) => (
              <SelectItem key={origin.id} value={origin.id}>
                {origin.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub-Origen */}
      <div className="space-y-2">
        <Label htmlFor="subOrigin">Sub-Origen</Label>
        <Input
          id="subOrigin"
          value={formData.subOrigin ?? ""}
          onChange={(e) => handleChange("subOrigin", e.target.value)}
          placeholder="URL especifica, publicacion, etc."
        />
      </div>

      {/* Empleados */}
      <div className="space-y-2">
        <Label htmlFor="employeeCound">Numero de Empleados</Label>
        <Select
          value={formData.originId ?? "none"}
          onValueChange={(value) =>
            handleChange("employeeCount", value === "none" ? undefined : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona Numero de Empleados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No ahora</SelectItem>
            {LEAD_EMPLOYEE_OPTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="website">Sitio web</Label>
        <Input
          id="website"
          value={formData.website ?? ""}
          onChange={(e) => handleChange("website", e.target.value)}
          placeholder="https://ejemplo.com"
          type="url"
        />
      </div>

      {/* LinkedIn */}
      <div className="space-y-2">
        <Label htmlFor="linkedInUrl">LinkedIn</Label>
        <Input
          id="linkedInUrl"
          value={formData.linkedInUrl ?? ""}
          onChange={(e) => handleChange("linkedInUrl", e.target.value)}
          placeholder="https://linkedin.com/company/..."
          type="url"
        />
      </div>

      {/* Dirección */}
      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          value={formData.address ?? ""}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Dirección de la empresa"
        />
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes ?? ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Notas adicionales sobre el lead..."
          rows={3}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEditing
              ? "Guardando..."
              : "Creando..."
            : isEditing
              ? "Guardar cambios"
              : "Crear lead"}
        </Button>
      </div>
    </form>
  );
}
