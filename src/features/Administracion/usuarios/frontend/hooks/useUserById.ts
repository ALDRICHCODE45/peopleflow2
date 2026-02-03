import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../../server/presentation/actions/user.actions";

export function useUserById(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: async () => {
      const result = await getUserById({ userId: userId! });
      if (result.error) throw new Error(result.error);
      return result.user;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos de usuario no cambian frecuentemente
  });
}
