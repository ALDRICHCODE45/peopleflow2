"use client";

import { useState } from "react";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Input } from "@/core/shared/ui/shadcn/input";
import { Label } from "@/core/shared/ui/shadcn/label";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";
import type { Contact, InteractionFormData, InteractionType } from "../types";
import { INTERACTION_TYPE_OPTIONS } from "../types";

interface InteractionFormProps {
  contacts: Contact[];
  onSubmit: (data: InteractionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InteractionForm({
  contacts,
  onSubmit,
  onCancel,
  isLoading = false,
}: InteractionFormProps) {
  const [formData, setFormData] = useState<InteractionFormData>({
    contactId: contacts[0]?.id ?? "",
    type: "CALL",
    subject: "",
    content: "",
    date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (
    field: keyof InteractionFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactId">Contacto *</Label>
          <Select
            value={formData.contactId}
            onValueChange={(value) => handleChange("contactId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un contacto" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}
                  {contact.isPrimary && " (Principal)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              handleChange("type", value as InteractionType)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent>
              {INTERACTION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Fecha y hora</Label>
        <Input
          id="date"
          type="datetime-local"
          value={formData.date}
          onChange={(e) => handleChange("date", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Asunto *</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => handleChange("subject", e.target.value)}
          placeholder="Asunto de la interacción"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Descripción</Label>
        <Textarea
          id="content"
          value={formData.content ?? ""}
          onChange={(e) => handleChange("content", e.target.value)}
          placeholder="Detalles de la interacción..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !formData.contactId}>
          {isLoading ? "Guardando..." : "Guardar interacción"}
        </Button>
      </div>
    </form>
  );
}
