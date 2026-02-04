import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ingresos",
  description:
    "Registro, seguimiento y análisis de ingresos y flujos de entrada de la organización.",
};

export default function IngresosPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Ingresos</h1>
      <p className="text-muted-foreground">
        Página de Ingresos en construcción
      </p>
    </div>
  );
}
