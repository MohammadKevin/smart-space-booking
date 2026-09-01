"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function DashboardReservationsRedirect() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const role = user?.role?.toLowerCase();
    if (role === "admin_space" || role === "owner") {
      router.replace("/dashboard/owner/reservations");
    } else if (role === "staff") {
      router.replace("/dashboard/staff");
    } else {
      router.replace("/dashboard/member");
    }
  }, [router, user]);

  return null;
}
