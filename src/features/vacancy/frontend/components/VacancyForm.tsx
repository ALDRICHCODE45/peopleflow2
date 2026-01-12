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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shadcn/dialog";
import type { Vacancy, VacancyStatus } from "../types/vacancy.types";
import { VACANCY_STATUS_OPTIONS } from "../types/vacancy.types";

interface VacancyFormProps {
  vacancy?: Vacancy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description: string;
    status?: VacancyStatus;
    department?: string;
    location?: string;
  }) => Promise<{ error: string | null }>;
}

export function VacancyForm({
  vacancy,
  open,
  onOpenChange,
  onSubmit,
}: VacancyFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<VacancyStatus>("DRAFT");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!vacancy;

  // Actualizar el formulario cuando cambia la vacante
  useEffect(() => {
    if (vacancy) {
      setTitle(vacancy.title);
      setDescription(vacancy.description);
      setStatus(vacancy.status);
      setDepartment(vacancy.department || "");
      setLocation(vacancy.location || "");
    } else {
      setTitle("");
      setDescription("");
      setStatus("DRAFT");
      setDepartment("");
      setLocation("");
    }
    setError(null);
  }, [vacancy, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await onSubmit({
        title,
        description,
        status,
        department: department || undefined,
        location: location || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
      }
    } catch (err) {
      setError("Error inesperado");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Vacante" : "Nueva Vacante"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la vacante"
              : "Completa los datos para crear una nueva vacante"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titulo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Desarrollador Full Stack"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripcion *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe los requisitos y responsabilidades del puesto..."
              rows={4}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as VacancyStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {VACANCY_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ej: Tecnologia"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Ubicacion</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Remoto, Ciudad de Mexico"
            />
          </div>
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Guardando..."
                : isEditing
                  ? "Guardar Cambios"
                  : "Crear Vacante"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
