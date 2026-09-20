"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardCheckinRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/staff");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="flex flex-col items-center gap-2.5 text-slate-500">
        <Loader2 className="w-7 h-7 text-sky-600 animate-spin" />
        <p className="text-xs font-semibold">Mengarahkan ke Staff Check-in...</p>
      </div>
    </div>
  );
}
