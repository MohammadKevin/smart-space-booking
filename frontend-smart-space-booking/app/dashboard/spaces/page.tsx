"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardSpacesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/owner/spaces");
  }, [router]);

  return null;
}
