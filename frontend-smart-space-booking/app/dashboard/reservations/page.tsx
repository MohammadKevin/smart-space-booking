"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function DashboardReservationsRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const role = user?.role?.toLowerCase();
    if (role === "admin_space" || role === "owner") {
      router.replace("/dashboard/owner/reservations");
    } else if (role === "staff") {
      router.replace("/dashboard/staff");
    } else {
      router.replace("/dashboard/member");
    }
  }, [router, user, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="flex flex-col items-center gap-2.5 text-slate-500">
        <Loader2 className="w-7 h-7 text-sky-600 animate-spin" />
        <p className="text-xs font-semibold">Mengarahkan ke Reservasi...</p>
      </div>
    </div>
  );
}
