"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSpaces, Space } from "@/lib/api";
import { SpaceCard } from "@/components/SpaceCard";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Users,
  Clock,
  Sparkles,
  QrCode,
  CheckCircle2,
  Calendar,
  Wifi,
  MonitorCheck,
  Armchair,
  KeyRound,
  Coffee,
  Printer,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickSearch, setQuickSearch] = useState("");

  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await getSpaces();
        // Dynamically fetch top 4 spaces
        setSpaces(data.slice(0, 4));
      } catch {
        // Handled gracefully
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      router.push(`/spaces?search=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      router.push("/spaces");
    }
  };

  const amenities = [
    {
      icon: Wifi,
      title: "High-Speed WiFi",
      description:
        "Koneksi internet Gigabit Mesh ultra-cepat dan stabil dengan dedicated bandwidth untuk video call tanpa hambatan.",
    },
    {
      icon: MonitorCheck,
      title: "Modern Meeting Rooms",
      description:
        "Ruang rapat kedap suara dilengkapi Smart 4K TV, wireless presentation, sound system premium, dan whiteboard.",
    },
    {
      icon: Armchair,
      title: "Dedicated Workstations",
      description:
        "Meja kerja individual dengan kursi ergonomis, stopkontak dedicated, dan tata pencahayaan yang nyaman.",
    },
    {
      icon: KeyRound,
      title: "24/7 Smart QR Access",
      description:
        "Akses pintu masuk fleksibel kapan saja menggunakan tiket QR Code yang terverifikasi otomatis pada sistem.",
    },
    {
      icon: Coffee,
      title: "Pantry & Free Flow Coffee",
      description:
        "Pilihan artisan coffee, teh premium, dan dispenser air minum gratis untuk menjaga fokus kerja Anda sepanjang hari.",
    },
    {
      icon: Printer,
      title: "Print & Scan Hub",
      description:
        "Fasilitas printer laser warna, scanning dokumen resolusi tinggi, dan perlengkapan stationery siap pakai.",
    },
  ];

  return (
    <div className="flex flex-col space-y-16 md:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-16 overflow-hidden bg-gradient-to-b from-white via-sky-50/50 to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700 border border-sky-200 shadow-sm animate-in fade-in duration-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Sistem Reservasi Coworking & Meeting Terintegrasi</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Pesan Ruang Kerja & Meeting{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-600">
                Seketika
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Akses cepat ke workstation ergonomis, ruang rapat berteknologi 4K, dan private office dengan integrasi QR Code check-in instan.
            </p>

            {/* Quick Search Bar */}
            <form
              onSubmit={handleHeroSearch}
              className="max-w-xl mx-auto p-2 bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/60 flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Cari nama ruangan, kota, atau kapasitas..."
                className="flex-1 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-sm font-bold rounded-xl shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <span>Cari Ruangan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Tanpa Biaya Tersembunyi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Validasi Diskon Promo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Tiket QR Otomatis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Spaces Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ruangan Unggulan Live</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Pilihan Ruang Kerja Terpopuler
            </h2>
          </div>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
          >
            <span>Lihat Semua Ruangan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 h-80 animate-pulse"
              />
            ))}
          </div>
        ) : spaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            Belum ada ruangan yang terdaftar di katalog saat ini.
          </div>
        )}
      </section>

      {/* Features & Amenities Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10" id="features">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            Fasilitas & Keunggulan
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Fasilitas Lengkap untuk Produktivitas Maksimal
          </h2>
          <p className="text-sm text-slate-600">
            Seluruh ruangan didesain dengan standar profesional untuk mendukung kenyamanan kerja individu maupun kolaborasi tim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {amenities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-sky-300 hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Langkah Mudah
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Cara Kerja Smart Space Booking
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 font-black text-sm flex items-center justify-center border border-sky-500/30">
                1
              </div>
              <h3 className="text-base font-bold text-white">Pilih Ruang & Jadwal</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pilih tipe space yang Anda butuhkan, tentukan tanggal, jam mulai, dan durasi sewa secara fleksibel.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 font-black text-sm flex items-center justify-center border border-sky-500/30">
                2
              </div>
              <h3 className="text-base font-bold text-white">Konfirmasi & Dapatkan QR</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Masukkan kode kupon diskon jika ada, buat reservasi seketika, dan dapatkan tiket QR Code resmi.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 font-black text-sm flex items-center justify-center border border-sky-500/30">
                3
              </div>
              <h3 className="text-base font-bold text-white">Check-In & Mulai Bekerja</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tiba di lokasi coworking, tunjukkan QR Code pada petugas/scanner, dan nikmati fasilitas lengkap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-sky-600/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Siap Memulai Hari Kerja Lebih Produktif?
            </h2>
            <p className="text-sky-100 text-sm max-w-xl leading-relaxed">
              Bergabung bersama ribuan profesional, freelancer, dan tim bisnis yang menggunakan SmartSpace setiap hari.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              href="/register"
              className="px-6 py-3 bg-white text-sky-700 hover:bg-slate-50 font-bold text-sm rounded-xl shadow-md transition-all"
            >
              Daftar Gratis
            </Link>
            <Link
              href="/spaces"
              className="px-6 py-3 bg-sky-700/60 hover:bg-sky-700 text-white font-bold text-sm rounded-xl border border-sky-400/40 transition-all flex items-center gap-1.5"
            >
              <span>Jelajahi Ruangan</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
