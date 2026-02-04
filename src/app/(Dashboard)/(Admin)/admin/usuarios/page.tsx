import type { Metadata } from "next";
import { UsersListPage } from "@/features/Administracion/usuarios/frontend/pages/UsersListPage";

export const metadata: Metadata = {
  title: "Usuarios",
  description:
    "Administración de usuarios, asignación de roles y gestión de accesos del sistema.",
};

export default function UsuariosPage() {
  return <UsersListPage />;
}
