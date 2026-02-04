import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Egresos",
  description:
    "Registro, seguimiento y control de egresos, gastos y flujos de salida de la organización.",
};

export default function EgresosPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Egresos</h1>
      <p className="text-muted-foreground">
        Página de Egresos en construcción
      </p>
    </div>
  );
}
