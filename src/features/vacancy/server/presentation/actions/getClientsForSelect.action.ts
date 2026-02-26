"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import prisma from "@lib/prisma";

export interface ClientOption {
  id: string;
  nombre: string;
}

export interface GetClientsResult {
  error: string | null;
  clients: ClientOption[];
}

export async function getClientsForSelectAction(): Promise<GetClientsResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: "No autenticado", clients: [] };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: "No hay tenant activo", clients: [] };

    const clients = await prisma.client.findMany({
      where: { tenantId },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });

    return { error: null, clients };
  } catch (error) {
    console.error("Error getting clients:", error);
    return { error: "Error al obtener clientes", clients: [] };
  }
}
