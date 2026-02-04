import type { Metadata } from "next";
import { LeadsListPage } from "@/features/Leads/frontend/pages/LeadsListPage";

export const metadata: Metadata = {
  title: "Leads",
  description:
    "Gestión de leads, prospección comercial y seguimiento de oportunidades de venta.",
};

export default function LeadsPage() {
  return <LeadsListPage />;
}
