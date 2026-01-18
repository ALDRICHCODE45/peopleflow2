/**
 * Re-exportacion del caso de uso CreateUserUseCase desde auth-rbac
 * Este caso de uso crea un nuevo usuario usando Better Auth API
 */

export {
  CreateUserUseCase,
  type CreateUserInput,
  type CreateUserOutput,
} from "@/features/auth-rbac/server/application/use-cases/CreateUserUseCase";
