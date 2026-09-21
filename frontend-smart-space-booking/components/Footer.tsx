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
    <footer className="bg-white border-t border-slate-100 mt-auto w-full">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10">
          <div className="col-span-2 space-y-3.5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img
                src="/logo-worknest.png"
                alt="WorkNest"
                className="w-7 h-7 rounded-lg object-contain"
              />
              <span className="font-extrabold text-slate-900 text-base tracking-tight">
                WorkNest
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Sistem reservasi ruang kerja, ruang rapat, dan kantor privat per jam dengan akses kunci mandiri kode QR.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Ruang Kerja
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/spaces?tipe=desk" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Flex Desk
                </Link>
              </li>
              <li>
                <Link href="/spaces?tipe=meeting_room" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Ruang Rapat
                </Link>
              </li>
              <li>
                <Link href="/spaces?tipe=private_office" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Kantor Privat
                </Link>
              </li>
              <li>
                <Link href="/spaces" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Semua Ruangan
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Informasi
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#tata-cara" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Cara Pemesanan
                </Link>
              </li>
              <li>
                <Link href="/#tarif" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Struktur Tarif
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Tanya Jawab
                </Link>
              </li>
              <li>
                <Link href="/register?role=owner" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Daftarkan Venue
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Akses Akun
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Masuk
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Daftar Member
                </Link>
              </li>
              <li>
                <Link href="/register?role=owner" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Daftar Mitra Pengelola
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} WorkNest. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-5 text-slate-400">
            <Link href="/#faq" className="hover:text-slate-600 transition-colors">
              Privasi
            </Link>
            <Link href="/#faq" className="hover:text-slate-600 transition-colors">
              Ketentuan
            </Link>
            <Link href="/spaces" className="hover:text-slate-600 transition-colors">
              Lokasi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
