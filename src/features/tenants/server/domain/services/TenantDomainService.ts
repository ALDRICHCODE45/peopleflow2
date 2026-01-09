import { Tenant } from "../entities/Tenant";

/**
 * Servicio de dominio para Tenants
 * Contiene reglas de negocio puras relacionadas con tenants
 */

export class TenantDomainService {
  /**
   * Genera un slug válido a partir del nombre
   */
  generateSlugFromName(name: string): string {
    return Tenant.generateSlug(name);
  }

  /**
   * Valida si el slug tiene formato correcto
   */
  isValidSlug(slug: string): boolean {
    return Tenant.isValidSlug(slug);
  }

  /**
   * Valida los datos para crear un tenant
   */
  validateCreateTenantData(
    name: string,
    slug?: string,
  ): { valid: boolean; error?: string } {
    if (!name || name.trim().length < 2) {
      return {
        valid: false,
        error: "El nombre debe tener al menos 2 caracteres",
      };
    }

    if (name.length > 100) {
      return {
        valid: false,
        error: "El nombre no puede exceder 100 caracteres",
      };
    }

    if (slug && !this.isValidSlug(slug)) {
      return {
        valid: false,
        error:
          "El slug solo puede contener letras minúsculas, números y guiones",
      };
    }

    return { valid: true };
  }
}
