"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSpaces, Space, getApiErrorMessage } from "@/lib/api";
import { SpaceCard } from "@/components/SpaceCard";
import {
  Search,
  Building2,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
  MapPin,
  Loader2,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  // Command bar filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [minCapacity, setMinCapacity] = useState<string>("");

  useEffect(() => {
    async function loadFeaturedSpaces() {
      setLoading(true);
      try {
        const data = await getSpaces();
        setSpaces(data.slice(0, 6));
      } catch (err: unknown) {
        // Handled silently for landing page
      } finally {
        setLoading(false);
      }
    }
    loadFeaturedSpaces();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedType) params.set("tipe", selectedType);
    if (minCapacity) params.set("kapasitas", minCapacity);
    router.push(`/spaces?${params.toString()}`);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Top Hero & Integrated Command Bar */}
      <section className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Sistem Reservasi & Okupansi Fisik Terpadu</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Sewa Ruang Kerja & Workstation dengan Verifikasi Tiket QR
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Cari ketersediaan ruang rapat, hot desk, atau private office secara real-time. Langsung bayar per jam dan akses pintu dengan kode tiket mandiri.
            </p>
          </div>

          {/* Integrated Command Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-md text-slate-900 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center"
          >
            {/* Search Input */}
            <div className="sm:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama ruangan / lokasi..."
                className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
              />
            </div>

            {/* Type Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600 cursor-pointer"
              >
                <option value="">Semua Tipe Ruangan</option>
                <option value="desk">Hot Desk / Workstation</option>
                <option value="meeting_room">Meeting Room</option>
                <option value="private_office">Private Office</option>
              </select>
            </div>

            {/* Capacity Filter */}
            <div className="sm:col-span-3">
              <select
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600 cursor-pointer"
              >
                <option value="">Kapasitas Bebas</option>
                <option value="1">Min. 1 Orang</option>
                <option value="4">Min. 4 Orang</option>
                <option value="8">Min. 8 Orang</option>
                <option value="12">Min. 12+ Orang</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Cari Ruangan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Featured Spaces Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pilihan Ruang Kerja Tersedia
            </h2>
            <p className="text-xs text-slate-500">
              Daftar ruangan aktif yang siap digunakan untuk kebutuhan harian atau rapat tim.
            </p>
          </div>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
          >
            <span>Buka Seluruh Katalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat inventaris ruangan...</p>
          </div>
        ) : spaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-3">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Belum ada data ruangan yang terdaftar di sistem.
            </p>
          </div>
        )}
      </section>

      {/* Operational Protocol & Signature Check-in Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Protokol Operasional & Verifikasi Check-In
            </h2>
            <p className="text-xs text-slate-500">
              Bagaimana sistem mengintegrasikan pemesanan online dengan verifikasi fisik di lokasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Reservasi & Konfigurasi Jam
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pilih ruangan, tentukan tanggal dan durasi jam sewa. Tarif dihitung transparan per jam secara real-time.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Penerbitan Tiket & Kode QR
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sistem menerbitkan tiket digital instan dengan kode alfanumerik unik yang tersimpan di Dashboard Member.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Validasi Check-In di Lokasi
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Staff di resepsionis memindai atau menginput kode tiket di terminal operasional untuk membuka sesi pemakaian.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
