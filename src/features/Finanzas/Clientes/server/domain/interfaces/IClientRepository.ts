/**
 * Interfaz del repositorio de Clientes
 * Define el contrato para la capa de infraestructura
 */

import { Client } from "../entities/Client";

export interface CreateClientData {
  nombre: string;
  leadId: string;
  generadorId: string | null;
  origenId: string | null;
  tenantId: string;
  createdById: string | null;
}

export interface IClientRepository {
  /**
   * Crea un nuevo cliente
   */
  create(data: CreateClientData): Promise<Client>;

  /**
   * Busca un cliente por el ID del Lead original
   */
  findByLeadId(leadId: string, tenantId: string): Promise<Client | null>;
}
