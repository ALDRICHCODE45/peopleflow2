import type { Metadata } from "next";
import { InvoicesListPage } from "@features/Finanzas/Facturas/frontend/pages/InvoicesListPage";

export const metadata: Metadata = {
  title: "Facturas",
  description:
    "Registro, seguimiento y análisis de facturas y flujos de entrada de la organización.",
};

export default function FacturasTablePage() {
  return <InvoicesListPage />;
}
