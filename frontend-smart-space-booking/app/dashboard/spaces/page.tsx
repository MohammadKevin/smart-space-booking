"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function DashboardSpacesRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const role = user?.role?.toLowerCase();
    if (role === "admin_space" || role === "owner") {
      router.replace("/dashboard/owner/spaces");
    } else {
      router.replace("/dashboard/member/spaces");
    }
  }, [router, user, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="flex flex-col items-center gap-2.5 text-slate-500">
        <Loader2 className="w-7 h-7 text-sky-600 animate-spin" />
        <p className="text-xs font-semibold">Mengarahkan ke Ruangan...</p>
      </div>
    </div>
  );
}
