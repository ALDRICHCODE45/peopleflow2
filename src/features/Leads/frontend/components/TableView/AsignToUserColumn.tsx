import { useUserById } from "@/features/Administracion/usuarios/frontend/hooks/useUserById";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";

interface Props {
  userId: string | null;
}

export const AsignToUserColumn = ({ userId }: Props) => {
  const { data: user, isLoading } = useUserById(userId);

  if (!userId) {
    return <span className="text-muted-foreground">-</span>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <span className="text-muted-foreground">-</span>;
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className="flex items-center gap-3 max-w-[200px]">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={user.image ?? undefined} alt={user.name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{user.name || "-"}</div>
        <span className="text-muted-foreground text-xs truncate block">
          {user.email}
        </span>
      </div>
    </div>
  );
};
