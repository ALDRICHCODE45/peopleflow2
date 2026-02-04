import type { Metadata } from "next";
import { LeadsKabanPage } from "@/features/Leads/frontend/pages/LeadsKanbanPage";

export const metadata: Metadata = {
  title: "Kanban de Leads",
  description:
    "Tablero kanban para visualización y gestión del pipeline de ventas y leads.",
};

export default function KanbanLeadsPage() {
  return <LeadsKabanPage />;
}
