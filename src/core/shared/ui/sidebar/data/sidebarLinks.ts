import {
  UserSearch,
  Tag,
  Files,
  Settings,
  Wallet,
} from "@hugeicons/core-free-icons";

/**
 * Configuración de enlaces del sidebar
 *
 * Las URLs deben coincidir con las rutas definidas en route-permissions.config.ts
 */

export const sidebarLinks = {
  user: {
    name: "Usuario",
    email: "usuario@ejemplo.com",
    avatar: "/avatars/default.jpg",
  },
  navMain: [
    {
      title: "Administración",
      url: "admin",
      icon: Files,
      items: [
        {
          title: "Usuarios",
          url: "/admin/usuarios",
        },
        {
          title: "Roles y Permisos",
          url: "/admin/roles-permisos",
        },
      ],
    },
    {
      title: "Finanzas",
      url: "finanzas",
      icon: Wallet,
      items: [
        {
          title: "Ingresos",
          url: "/finanzas/ingresos",
        },
        {
          title: "Egresos",
          url: "/finanzas/egresos",
        },
      ],
    },
    {
      title: "Reclutamiento",
      url: "reclutamiento",
      icon: UserSearch,
      items: [
        {
          title: "Vacantes",
          url: "/reclutamiento/vacantes",
        },
        {
          title: "Kanban Board",
          url: "/reclutamiento/kanban",
        },
        {
          title: "Reportes",
          url: "/reclutamiento/reportes",
        },
      ],
    },
    {
      title: "Ventas",
      url: "generacion-de-leads",
      icon: Tag,
      items: [
        {
          title: "Leads",
          url: "/generacion-de-leads/leads",
        },
        {
          title: "Kanban Board",
          url: "/generacion-de-leads/kanban",
        },
        {
          title: "Reportes",
          url: "/generacion-de-leads/reportes",
        },
      ],
    },
    {
      title: "Sistema",
      url: "system",
      icon: Settings,
      items: [
        {
          title: "Actividad",
          url: "/system/activity",
        },
        {
          title: "Configuración",
          url: "/system/config",
        },
      ],
    },
  ],
};
