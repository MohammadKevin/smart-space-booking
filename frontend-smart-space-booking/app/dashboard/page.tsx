"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function DashboardRootRedirect() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const role = user.role?.toLowerCase();
    if (role === "admin_space" || role === "owner") {
      router.replace("/dashboard/owner");
    } else if (role === "staff") {
      router.replace("/dashboard/staff");
    } else {
      router.replace("/dashboard/member");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="flex flex-col items-center gap-2.5 text-slate-500">
        <Loader2 className="w-7 h-7 text-cyan-600 animate-spin" />
        <p className="text-xs font-semibold">Mengarahkan ke Dashboard...</p>
      </div>
    </div>
  );
}
