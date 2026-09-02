"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSpaces, Space } from "@/lib/api";
import { SpaceCard } from "@/components/SpaceCard";
import {
  Search,
  Building2,
  Users,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Clock,
  CheckCircle2,
  Activity,
  Loader2,
  Wifi,
  Coffee,
  MonitorCheck,
  Armchair,
  ChevronRight,
  HelpCircle,
  Laptop,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [minCapacity, setMinCapacity] = useState<string>("");

  useEffect(() => {
    async function loadFeaturedSpaces() {
      setLoading(true);
      setError(false);
      try {
        const data = await getSpaces();
        setSpaces(data.slice(0, 6));
      } catch {
        setError(true);
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

  const handleCategoryClick = (tipe: string) => {
    router.push(`/spaces?tipe=${tipe}`);
  };

  return (
    <div className="space-y-12 pb-20 bg-white min-h-screen">
      <section className="relative bg-gradient-to-b from-cyan-50/70 via-sky-50/30 to-white border-b border-cyan-100/80 pt-10 pb-14 lg:pt-14 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-3xl mx-auto text-center space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-white border border-cyan-200 text-cyan-800 shadow-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>Sistem Reservasi & Okupansi Fisik Terpadu</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Sewa Ruang Kerja & Rapat dengan{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600">
                Verifikasi Tiket QR
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Cek ketersediaan hot desk harian, meeting room eksekutif, dan private office secara real-time. Bayar per jam sesuai pemakaian, tanpa biaya tersembunyi.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-xl p-3 sm:p-4 border border-cyan-200/90 shadow-xl shadow-cyan-950/5 text-slate-900 grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center"
            >
              <div className="sm:col-span-5 relative">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 ml-0.5">
                  Nama ruangan atau coworking
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyan-600 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Contoh: Meeting Room A, Hot Desk..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 ml-0.5">
                  Tipe ruangan
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                >
                  <option value="">Semua tipe</option>
                  <option value="desk">Hot Desk / Workstation</option>
                  <option value="meeting_room">Meeting Room</option>
                  <option value="private_office">Private Office</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 ml-0.5">
                  Kapasitas
                </label>
                <select
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                >
                  <option value="">Bebas</option>
                  <option value="1">1 orang</option>
                  <option value="4">4+ orang</option>
                  <option value="8">8+ orang</option>
                  <option value="12">12+ orang</option>
                </select>
              </div>

              <div className="sm:col-span-2 sm:self-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-600/30"
                >
                  <span>Cari ruang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">Kategori cepat:</span>
              <button
                type="button"
                onClick={() => handleCategoryClick("desk")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-cyan-50 border border-cyan-200 text-cyan-800 transition-colors shadow-2xs"
              >
                <Laptop className="w-3.5 h-3.5 text-cyan-600" />
                <span>Hot Desk</span>
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick("meeting_room")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-cyan-50 border border-cyan-200 text-cyan-800 transition-colors shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                <span>Meeting Room</span>
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick("private_office")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-cyan-50 border border-cyan-200 text-cyan-800 transition-colors shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>Private Office</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-5 border-t border-cyan-100 text-xs">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-cyan-100 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Bayar per jam</p>
                <p className="text-[11px] text-slate-500">Tarif jelas tanpa kontrak</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-cyan-100 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Tiket QR digital</p>
                <p className="text-[11px] text-slate-500">Terbit langsung di dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-cyan-100 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Akses terverifikasi</p>
                <p className="text-[11px] text-slate-500">Divalidasi di resepsionis</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-cyan-100 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Ketersediaan live</p>
                <p className="text-[11px] text-slate-500">Database real-time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="max-w-2xl space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Pilihan Tipe Ruang Kerja
          </h2>
          <p className="text-xs text-slate-500">
            Dari meja kerja personal hingga ruang rapat presentasi eksekutif.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => handleCategoryClick("desk")}
            className="group bg-white rounded-xl border border-slate-200 p-5 space-y-3.5 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/5 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hot Desk & Workstation</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Meja kerja dedicated untuk individu atau remote worker dengan koneksi internet gigabit dan stopkontak di tiap meja.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-cyan-600 group-hover:text-cyan-700">
              <span>Mulai Rp 20.000 / jam</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => handleCategoryClick("meeting_room")}
            className="group bg-white rounded-xl border border-slate-200 p-5 space-y-3.5 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/5 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Meeting Room Eksekutif</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ruangan rapat berperedam suara, dilengkapi layar presentasi 4K, whiteboard magnetik, dan setup konferensi audio visual.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-cyan-600 group-hover:text-cyan-700">
              <span>Mulai Rp 50.000 / jam</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => handleCategoryClick("private_office")}
            className="group bg-white rounded-xl border border-slate-200 p-5 space-y-3.5 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/5 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Private Focus Office</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ruangan privat tertutup untuk tim berkapasitas 4-10 orang dengan kontrol akses mandiri dan privasi penuh.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-cyan-600 group-hover:text-cyan-700">
              <span>Mulai Rp 100.000 / jam</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-3.5">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Ruang Siap Pakai Hari Ini
            </h2>
            <p className="text-xs text-slate-500">
              Data terhubung langsung dengan sistem reservasi. Pilih ruangan untuk melihat rincian dan kalkulasi biaya.
            </p>
          </div>

          <Link
            href="/spaces"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <span>Buka seluruh katalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2.5 py-4 px-6 bg-gradient-to-r from-cyan-50/80 via-white to-sky-50/80 rounded-xl border border-cyan-200/80 text-cyan-800 shadow-2xs">
              <Loader2 className="w-4 h-4 text-cyan-600 animate-spin shrink-0" />
              <span className="text-xs font-bold tracking-wide">Sinkronisasi Inventaris Ruangan Terkini...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-pulse space-y-3"
                >
                  <div className="aspect-[16/10] bg-slate-200/70" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <div className="h-5 bg-slate-200 rounded w-1/3" />
                      <div className="h-7 bg-slate-200 rounded w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-10 text-center bg-white rounded-xl border border-rose-200 space-y-3">
            <Building2 className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Gagal Memuat Data Ruangan</p>
            <p className="text-xs text-slate-500">
              Server API sedang tidak merespons atau koneksi terputus. Silakan coba lagi.
            </p>
            <button
              type="button"
              onClick={() => {
                setError(false);
                setLoading(true);
                getSpaces()
                  .then((data) => setSpaces(data.slice(0, 6)))
                  .catch(() => setError(true))
                  .finally(() => setLoading(false));
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        ) : spaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-xl border border-slate-200 space-y-2">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Belum ada data ruangan yang terdaftar di sistem.
            </p>
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-cyan-50/70 via-sky-50/40 to-white rounded-xl border border-cyan-200/80 p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Alur Reservasi & Check-In
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pemesanan online di browser terhubung langsung dengan validasi fisik di meja resepsionis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2.5 p-4 rounded-lg bg-white border border-cyan-100 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shadow-cyan-600/20">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-xs">Pilih & atur jam</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tentukan ruangan, tanggal, jam mulai, dan durasi. Tarif dihitung transparan per jam.
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-lg bg-white border border-cyan-100 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shadow-cyan-600/20">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-xs">Terima tiket QR</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tiket digital dengan kode unik terbit instan dan tersimpan di Dashboard Member Anda.
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-lg bg-white border border-cyan-100 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shadow-cyan-600/20">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-xs">Scan di lokasi</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tunjukkan tiket QR kepada staff resepsionis untuk divalidasi lewat terminal scanner.
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-lg bg-white border border-cyan-100 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shadow-cyan-600/20">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-xs">Sesi aktif & check-out</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Nikmati fasilitas kerja lengkap. Pemakaian tercatat akurat hingga check-out selesai.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="max-w-2xl space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Fasilitas Standar Ruangan
          </h2>
          <p className="text-xs text-slate-500">
            Semua ruangan yang terdaftar dilengkapi fasilitas penunjang kerja tanpa biaya tambahan.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 text-center space-y-1.5 transition-colors shadow-2xs">
            <div className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Gigabit WiFi</p>
            <p className="text-[10px] text-slate-400">Hingga 1 Gbps</p>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 text-center space-y-1.5 transition-colors shadow-2xs">
            <div className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
              <Armchair className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Kursi ergonomis</p>
            <p className="text-[10px] text-slate-400">Mendukung postur</p>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 text-center space-y-1.5 transition-colors shadow-2xs">
            <div className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
              <Coffee className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Kopi & teh gratis</p>
            <p className="text-[10px] text-slate-400">Self-service</p>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 text-center space-y-1.5 transition-colors shadow-2xs">
            <div className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
              <MonitorCheck className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Stopkontak dedicated</p>
            <p className="text-[10px] text-slate-400">Tiap meja</p>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 text-center space-y-1.5 transition-colors shadow-2xs">
            <div className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Akses QR mandiri</p>
            <p className="text-[10px] text-slate-400">Validasi instan</p>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 text-center space-y-1.5 transition-colors shadow-2xs">
            <div className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">AC & ruang tenang</p>
            <p className="text-[10px] text-slate-400">Kondusif</p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight text-center">
          Pertanyaan Umum Seputar Pemesanan
        </h2>

        <div className="space-y-2.5 text-xs">
          <div className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-200 space-y-1 transition-colors shadow-2xs">
            <p className="font-semibold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>Apakah saya harus berlangganan bulanan untuk memesan ruangan?</span>
            </p>
            <p className="text-slate-600 pl-5.5 leading-relaxed">
              Tidak. WorkNest menganut model <em>pay-as-you-go</em>: Anda hanya membayar durasi jam yang disewa, tanpa komitmen kontrak bulanan.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-200 space-y-1 transition-colors shadow-2xs">
            <p className="font-semibold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>Bagaimana cara check-in saat tiba di coworking space?</span>
            </p>
            <p className="text-slate-600 pl-5.5 leading-relaxed">
              Buka Dashboard Member Anda di smartphone, lalu tunjukkan tiket kode QR atau kode alfanumerik kepada staff resepsionis di lokasi.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-200 space-y-1 transition-colors shadow-2xs">
            <p className="font-semibold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>Apakah saya bisa membatalkan pemesanan jika jadwal berubah?</span>
            </p>
            <p className="text-slate-600 pl-5.5 leading-relaxed">
              Ya. Pemesanan berstatus <em>pending</em> atau <em>disetujui</em> dapat dibatalkan langsung dari menu riwayat reservasi di Dashboard Member Anda.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 rounded-xl p-7 sm:p-10 text-white border border-cyan-500 shadow-xl shadow-cyan-900/10 text-center space-y-5">
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              Siap Mengamankan Ruang Kerja Produktif Anda?
            </h2>
            <p className="text-xs text-cyan-100 leading-relaxed font-normal">
              Daftar akun gratis sekarang, atau langsung jelajahi katalog ruangan yang tersedia di seluruh lokasi coworking space.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/spaces"
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-cyan-50 active:bg-cyan-100 text-cyan-900 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>Jelajahi katalog ruangan</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-700" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-5 py-2.5 bg-cyan-700/80 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold text-xs rounded-lg border border-cyan-400/50 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Daftar akun member gratis</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}