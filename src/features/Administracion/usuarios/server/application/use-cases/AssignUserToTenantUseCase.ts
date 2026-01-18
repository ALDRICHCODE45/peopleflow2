/**
 * Re-exportacion del caso de uso AssignUserToTenantUseCase desde auth-rbac
 * Este caso de uso asigna un usuario a un tenant con un rol especifico
 */

export {
  AssignUserToTenantUseCase,
  type AssignUserToTenantInput,
  type AssignUserToTenantOutput,
} from "@/features/auth-rbac/server/application/use-cases/AssignUserToTenantUseCase";
