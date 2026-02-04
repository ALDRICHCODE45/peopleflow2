import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Actividad del Sistema",
  description:
    "Registro de actividad, auditoría de acciones y monitoreo de eventos del sistema.",
};

export default function ActivityPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Actividad del Sistema</h1>
      <p className="text-muted-foreground">
        Página de Actividad en construcción
      </p>
    </div>
  );
}
