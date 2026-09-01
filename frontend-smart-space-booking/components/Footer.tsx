import React from "react";
import Link from "next/link";
import { Building2, Compass, QrCode, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                SmartSpace
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Platform reservasi workstation fisik, ruang rapat, dan private office dengan verifikasi check-in instan.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-900">Katalog Ruangan</p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link href="/spaces?tipe=desk" className="hover:text-sky-600 transition-colors">
                  Hot Desk & Workstation
                </Link>
              </li>
              <li>
                <Link href="/spaces?tipe=meeting_room" className="hover:text-sky-600 transition-colors">
                  Meeting Room & Soundproof
                </Link>
              </li>
              <li>
                <Link href="/spaces?tipe=private_office" className="hover:text-sky-600 transition-colors">
                  Dedicated Private Office
                </Link>
              </li>
            </ul>
          </div>

          {/* Access Roles */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-900">Akses Platform</p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link href="/login" className="hover:text-sky-600 transition-colors">
                  Portal Member
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-sky-600 transition-colors">
                  Portal Space Owner
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-sky-600 transition-colors">
                  Terminal Staff Resepsionis
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification Protocol */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-900">Operasional</p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-sky-600" />
                <span>Verifikasi QR Mandiri</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Pemesanan terintegrasi langsung dengan database dan sistem validasi pintu / resepsionis.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} SmartSpace Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Live REST API Connected</span>
            <span>UKK RPL 2026/2027</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
