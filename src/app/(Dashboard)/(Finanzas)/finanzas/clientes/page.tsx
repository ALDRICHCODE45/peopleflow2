import type { Metadata } from "next";
import { ClientListPage } from "@/features/Finanzas/Clientes/frontend/pages/ClientesListPage";

export const metadata: Metadata = {
  title: "Clientes",
  description:
    "Gestión de clientes, cuentas por cobrar e historial de transacciones comerciales.",
};

export default function ClientesPage() {
  return <ClientListPage />;
}
