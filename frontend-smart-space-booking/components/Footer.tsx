"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrCode } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/member") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email"
  ) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-slate-200/80 mt-auto w-full py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#0D5C63] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">WorkNest</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} WorkNest Technologies Inc. Hak cipta dilindungi.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 font-medium">
            <Link href="/spaces" className="hover:text-slate-900 transition-colors">
              Ruangan
            </Link>
            <Link href="/#instant-rates" className="hover:text-slate-900 transition-colors">
              Tarif
            </Link>
            <Link href="/register?role=owner" className="hover:text-slate-900 transition-colors">
              Daftarkan Ruangan
            </Link>
            <Link href="/#faq" className="hover:text-slate-900 transition-colors">
              Keamanan &amp; Privasi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
