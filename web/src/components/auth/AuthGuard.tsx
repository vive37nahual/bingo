"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { canAccessRoute } from "@/lib/permissions";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, user, permissions, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!token || !user) {
      router.replace("/");
      return;
    }
    if (!canAccessRoute(pathname, permissions, isAdmin)) {
      router.replace("/dashboard/bingo");
    }
  }, [token, user, permissions, isAdmin, isLoading, pathname, router]);

  if (isLoading || !token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
