"use client";

import { useState } from "react";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Input } from "@/core/shared/ui/shadcn/input";
import { Label } from "@/core/shared/ui/shadcn/label";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { Checkbox } from "@/core/shared/ui/shadcn/checkbox";
import type { ContactFormData } from "../types";

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: ContactFormData;
}

export function ContactForm({
  onSubmit,
  isLoading = false,
  initialData,
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: initialData?.firstName ?? "",
    lastName: initialData?.lastName ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    position: initialData?.position ?? "",
    linkedInUrl: initialData?.linkedInUrl ?? "",
    isPrimary: initialData?.isPrimary ?? false,
    notes: initialData?.notes ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (
    field: keyof ContactFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="Nombre"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Apellido"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Puesto</Label>
        <Input
          id="position"
          value={formData.position ?? ""}
          onChange={(e) => handleChange("position", e.target.value)}
          placeholder="Director de RH, CEO, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email ?? ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="email@ejemplo.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone ?? ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+52 55 1234 5678"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedInUrl">LinkedIn</Label>
        <Input
          id="linkedInUrl"
          value={formData.linkedInUrl ?? ""}
          onChange={(e) => handleChange("linkedInUrl", e.target.value)}
          placeholder="https://linkedin.com/in/..."
          type="url"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes ?? ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Notas sobre el contacto..."
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPrimary"
          checked={formData.isPrimary}
          onCheckedChange={(checked) =>
            handleChange("isPrimary", checked as boolean)
          }
        />
        <Label
          htmlFor="isPrimary"
          className="text-sm font-normal cursor-pointer"
        >
          Contacto principal
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar contacto"}
        </Button>
      </div>
    </form>
  );
}
