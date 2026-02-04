import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kanban de Reclutamiento",
  description:
    "Tablero kanban para visualización y seguimiento del proceso de reclutamiento de candidatos.",
};

export default function KanbanPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Kanban</h1>
      <p className="text-muted-foreground">Página de Kanban en construcción</p>
    </div>
  );
}
