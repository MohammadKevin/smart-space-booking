"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkNestLogo } from "@/components/WorkNestLogo";
import {
  Search,
  ArrowLeft,
  LayoutDashboard,
  Compass,
  CalendarCheck,
  Headphones,
  ShieldCheck,
  ExternalLink,
  Lock,
  FileQuestion,
} from "lucide-react";

export default function NotFoundPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/spaces?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col justify-between font-sans">
      <header className="bg-white border-b border-slate-200/90 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <WorkNestLogo size="sm" showText={false} />
              <span className="font-extrabold text-sm tracking-tight text-slate-900">WorkNest</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wider">
              HTTP_STATUS_404_NOT_FOUND
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go back to previous view</span>
            </button>
            <span className="text-slate-200">|</span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>HQ Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center space-y-6 flex-1 flex flex-col justify-center">
        <div className="relative flex items-center justify-center select-none">
          <span className="font-black text-[120px] sm:text-[160px] text-slate-200/80 leading-none tracking-tight select-none">
            404
          </span>

          <div className="absolute bg-white rounded-2xl border border-slate-200/90 shadow-xl p-4 w-48 space-y-2 transform -rotate-2 hover:rotate-0 transition-transform">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              </div>
              <FileQuestion className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-1.5 py-1">
              <div className="h-2 bg-slate-100 rounded-full w-3/4" />
              <div className="h-2 bg-slate-100 rounded-full w-1/2" />
            </div>
            <div className="pt-1">
              <span className="block text-center py-1 rounded-lg bg-rose-50 text-rose-600 font-extrabold text-[10px] tracking-widest border border-rose-200">
                ACCESS DENIED
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Error Code: 404 • Halaman atau Ruangan Tidak Ditemukan</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Ruangan atau halaman tidak tersedia
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            URL yang Anda tuju mungkin telah dihapus, tautan pemesanan telah kedaluwarsa, atau ID ruangan tidak valid.
          </p>
        </div>

        <div className="max-w-lg mx-auto w-full pt-2">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ruangan, hub, atau lokasi..."
              className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 shadow-sm transition-all"
            />
            <kbd className="absolute right-3 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-400">
              Enter
            </kbd>
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold transition-all shadow-sm shadow-sky-600/25 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>

          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span>Katalog Ruangan (/spaces)</span>
          </Link>

          <Link
            href="/dashboard/member"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-sm"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Buka Dashboard Member</span>
          </Link>
        </div>

        <div className="pt-10 space-y-3 text-left">
          <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5" />
              <span>RUTE PENGALIHAN YANG DISIAPKAN</span>
            </div>
            <span className="font-mono text-[10px]">WorkNest Gateway Node 04</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            <Link
              href="/spaces"
              className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between h-full shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                  Katalog Ruangan
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Jelajahi puluhan ruang kerja dan coworking space terverifikasi di berbagai kota.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>JARINGAN AKTIF</span>
              </div>
            </Link>

            <Link
              href="/dashboard/member"
              className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between h-full shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                  Tiket Reservasi Saya
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cek tiket QR pass aktif dan kode akses pintu ruangan Anda.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-500">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>AKSES PENGGUNA</span>
              </div>
            </Link>

            <a
              href="https://wa.me/6281234567890?text=Halo,%20halaman%20ruangan%20tidak%20dapat%20ditemukan"
              target="_blank"
              rel="noreferrer"
              className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between h-full shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Pusat Bantuan
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hubungi customer support kami langsung melalui WhatsApp atau live chat.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-500">
                <span>RESPONS CEPAT</span>
              </div>
            </a>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between h-full shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Status Platform
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Seluruh sistem smart lock, pembayaran, dan autentikasi berjalan 99.9% uptime.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] font-bold text-emerald-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>SISTEM NORMAL</span>
                </div>
                <span className="text-slate-400 font-normal">v2.4.0</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200/90 py-3.5 px-4 sm:px-6 lg:px-8 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span>GATEWAY: CLOUD_EDGE_ACTIVE</span>
            <span className="text-slate-300">•</span>
            <span>SYSTEM: WORKNEST_CORE</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Butuh bantuan?</span>
            <a
              href="mailto:support@worknest.id"
              className="font-bold text-sky-600 hover:underline"
            >
              Hubungi Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
