import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PeopleFlow ERP",
    short_name: "PeopleFlow",
    description:
      "Sistema ERP empresarial para gestión de recursos humanos, reclutamiento, finanzas y ventas.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/logos/PeopleFlow-favicon.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
