import type { Metadata } from "next";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { PlacementsReportPage } from "@features/vacancy/frontend/pages/PlacementsReportPage";

export const metadata: Metadata = {
  title: "Reportes de Reclutamiento",
  description:
    "Reportes, métricas y análisis del módulo de reclutamiento y selección de personal.",
};

export default function ReclutadoresReportesPage() {
  return (
    <PermissionGuard
      permissions={[
        PermissionActions.reportesReclutamiento.acceder,
        PermissionActions.reportesReclutamiento.gestionar,
      ]}
      fallback={
        <div className="container mx-auto py-8">
          <p className="text-muted-foreground">
            No tienes permiso para acceder a los reportes de reclutamiento.
          </p>
        </div>
      }
    >
      <PlacementsReportPage />
    </PermissionGuard>
  );
}
