export const Routes = {
  home: "/",
  signIn: "/sign-in",
  verifyOtp: "/verify-otp",
  selectTenant: "/select-tenant",
  accessDenied: "/access-denied",
  superAdmin: "/super-admin",
  admin: {
    root: "/admin",
    rolesPermisos: "/admin/roles-permisos",
    usuarios: "/admin/usuarios",
  },
  reclutamiento: {
    vacantes: "/reclutamiento/vacantes",
  },
  leads: {
    kanban: "/generacion-de-leads/kanban",
    list: "/generacion-de-leads/leads",
  },
} as const;
