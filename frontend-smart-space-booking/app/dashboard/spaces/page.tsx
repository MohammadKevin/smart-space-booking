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
    if (role === "member") {
      router.replace("/member/spaces/explore");
    } else {
      router.replace("/dashboard/owner/spaces");
    }
  }, [router, user, isLoading]);

  return null;
}
