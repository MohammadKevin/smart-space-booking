"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  const isDashboard = pathname?.startsWith("/dashboard");
  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/verify-email");

  if (!pathname || isDashboard || isAuthPage) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-slate-100 mt-auto w-full py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <img src="/logo-worknest.png" alt="logo icon" className="w-8 h-8 rounded-lg" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">WorkNest</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} WorkNest Technologies Inc. Hak cipta dilindungi.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 font-medium">
            <Link href="/spaces" className="hover:text-sky-600 transition-colors">
              Eksplorasi Ruangan
            </Link>
            <Link href="/#tarif" className="hover:text-sky-600 transition-colors">
              Tarif
            </Link>
            <Link href="/register?role=owner" className="hover:text-sky-600 transition-colors">
              Daftarkan Ruangan
            </Link>
            <Link href="/#protocol" className="hover:text-sky-600 transition-colors">
              Teknologi IoT
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
