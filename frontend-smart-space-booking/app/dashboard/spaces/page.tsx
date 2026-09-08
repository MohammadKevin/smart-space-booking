"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

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

  return null;
}
