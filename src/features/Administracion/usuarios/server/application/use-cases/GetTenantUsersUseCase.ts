/**
 * Re-exportacion del caso de uso GetTenantUsersUseCase desde auth-rbac
 * Este caso de uso obtiene todos los usuarios de un tenant con sus roles
 */

export {
  GetTenantUsersUseCase,
  type GetTenantUsersInput,
  type GetTenantUsersOutput,
} from "@/features/auth-rbac/server/application/use-cases/GetTenantUsersUseCase";
