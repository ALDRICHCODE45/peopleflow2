import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facturas",
  description:
    "Registro, seguimiento y análisis de facturas y flujos de entrada de la organización.",
};

export default function FacturasTablePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Ingresos</h1>
      <p className="text-muted-foreground">
        Página de Facturas en construcción
      </p>
    </div>
  );
}
