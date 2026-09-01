import React from "react";
import Link from "next/link";
import { Building2, ShieldCheck, Zap, Heart, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                SmartSpace
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Platform reservasi coworking space & meeting room cerdas dengan integrasi QR Code check-in instan.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Backend API Connected
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Eksplorasi
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/spaces" className="text-slate-600 hover:text-sky-600 transition-colors">
                  Katalog Ruangan
                </Link>
              </li>
              <li>
                <Link href="/spaces?tipe=desk" className="text-slate-600 hover:text-sky-600 transition-colors">
                  Hot Desk & Workstation
                </Link>
              </li>
              <li>
                <Link href="/spaces?tipe=meeting_room" className="text-slate-600 hover:text-sky-600 transition-colors">
                  Meeting Room
                </Link>
              </li>
              <li>
                <Link href="/spaces?tipe=private_office" className="text-slate-600 hover:text-sky-600 transition-colors">
                  Private Office
                </Link>
              </li>
            </ul>
          </div>

          {/* Member & Owner */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Layanan & Akun
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-slate-600 hover:text-sky-600 transition-colors">
                  Masuk Akun
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-600 hover:text-sky-600 transition-colors">
                  Daftar Member Baru
                </Link>
              </li>
              <li>
                <Link href="/dashboard/reservations" className="text-slate-600 hover:text-sky-600 transition-colors">
                  Riwayat Reservasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Backend Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Integrasi API
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
                <span>JWT Authentication</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Dynamic Realtime Pricing</span>
              </li>
              <li className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>api-ukk.budayakita.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Smart Space Booking. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with Next.js App Router, Tailwind CSS & TypeScript
          </p>
        </div>
      </div>
    </footer>
  );
}
