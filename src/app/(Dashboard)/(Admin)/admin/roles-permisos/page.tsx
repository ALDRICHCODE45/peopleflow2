import type { Metadata } from "next";
import { RolesListPage } from "@/features/Administracion/roles/frontend/pages/RolesListPage";

export const metadata: Metadata = {
  title: "Roles y Permisos",
  description:
    "Configuración de roles, permisos y políticas de acceso del sistema.",
};

export default function RolesPermisosPage() {
  return <RolesListPage />;
}
