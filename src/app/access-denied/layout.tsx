import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso Denegado",
  description:
    "No tienes los permisos necesarios para acceder a esta sección de PeopleFlow.",
};

export default function AccessDeniedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
