import type { Metadata } from "next";
import { ClientDetailPage } from "@/features/Finanzas/Clientes/frontend/pages/ClientDetailPage";

export const metadata: Metadata = {
  title: "Detalle de Cliente",
  description: "Información y condiciones comerciales del cliente.",
};

export default async function ClienteDetailRoute({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return <ClientDetailPage clientId={clientId} />;
}
