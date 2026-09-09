"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MemberSpaceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/member/spaces");
  }, [router]);

  return null;
}
