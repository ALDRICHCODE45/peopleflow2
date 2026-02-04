import type { Metadata } from "next";
import { ConfiguracionPage } from "@features/Sistema/configuracion/frontend/pages/ConfiguracionPage";

export const metadata: Metadata = {
  title: "Configuración",
  description:
    "Configuración general del sistema, preferencias de la organización y parámetros del tenant.",
};

export default function ConfigPage() {
  return <ConfiguracionPage />;
}
