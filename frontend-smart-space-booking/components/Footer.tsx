"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrCode } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email"
  ) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md overflow-hidden shrink-0 border border-slate-200 shadow-xs flex items-center justify-center bg-white">
                <img src="/icon-web.png" alt="WorkNest" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                WorkNest
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Platform reservasi workstation fisik, ruang rapat, dan private office dengan verifikasi check-in instan.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-900">Katalog Ruangan</p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link href="/spaces?tipe=desk" className="hover:text-cyan-600 transition-colors">
                  Hot Desk & Workstation
                </Link>
              </li>
              <li>
                <Link href="/spaces?tipe=meeting_room" className="hover:text-cyan-600 transition-colors">
                  Meeting Room & Soundproof
                </Link>
              </li>
              <li>
                <Link href="/spaces?tipe=private_office" className="hover:text-cyan-600 transition-colors">
                  Dedicated Private Office
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-900">Akses Platform</p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link href="/login" className="hover:text-cyan-600 transition-colors">
                  Portal Member
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-cyan-600 transition-colors">
                  Portal Space Owner
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-cyan-600 transition-colors">
                  Terminal Staff Resepsionis
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-900">Operasional</p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-cyan-600" />
                <span>Verifikasi QR Mandiri</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Pemesanan terintegrasi langsung dengan database dan sistem validasi pintu / resepsionis.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&#169; {new Date().getFullYear()} WorkNest Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Live REST API Connected</span>
            <span>UKK RPL 2026/2027</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
