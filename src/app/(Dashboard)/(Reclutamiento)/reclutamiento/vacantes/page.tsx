import type { Metadata } from "next";
import { VacancyListPage } from "@/features/vacancy/frontend/pages/VacancyListPage";

export const metadata: Metadata = {
  title: "Vacantes",
  description:
    "Gestión de vacantes, publicación de ofertas laborales y seguimiento de posiciones abiertas.",
};

export default function VacantesPage() {
  return <VacancyListPage />;
}
