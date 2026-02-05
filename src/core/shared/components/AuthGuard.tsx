"use client";
import { useAuth } from "@/core/shared/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@shadcn/spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    // Redirect to OTP verification if email is not verified
    // Skip this check if already on verify-otp page
    if (isAuthenticated && user && !user.emailVerified && pathname !== "/verify-otp") {
      router.push("/verify-otp");
    }
  }, [isAuthenticated, isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      fallback || (
        <div
          className="flex items-center justify-center min-h-screen bg-white
  dark:bg-background"
        >
          <Spinner className="size-10 text-primary" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Block access if email is not verified (except for verify-otp page)
  if (user && !user.emailVerified && pathname !== "/verify-otp") {
    return null;
  }

  return <>{children}</>;
}
