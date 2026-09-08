"use client";

import React, { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSpaceDetail,
  getSpaceReviews,
  getSpaceRatingSummary,
  Space,
  Review,
  RatingSummary,
  getApiErrorMessage,
} from "@/lib/api";
import { formatRupiah } from "@/components/SpaceCard";
import {
  MapPin,
  Star,
  Users,
  Wifi,
  Tv,
  Radio,
  VolumeX,
  Coffee,
  CheckCircle2,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  Share2,
  Bookmark,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Loader2,
  AlertCircle,
  Cpu,
  Layers,
} from "lucide-react";

interface SpaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SpaceDetailPage({ params }: SpaceDetailPageProps) {
  const resolvedParams = use(params);
  const spaceId = parseInt(resolvedParams.id, 10);
  const router = useRouter();

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);

  // Booking Card State
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedHours, setSelectedHours] = useState<string[]>(["14:00", "15:00", "16:00"]);

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [spaceData, reviewsRes, summaryRes] = await Promise.all([
          getSpaceDetail(spaceId),
          getSpaceReviews(spaceId, 1, 10).catch(() => ({ data: [] } as any)),
          getSpaceRatingSummary(spaceId).catch(() => null),
        ]);
        setSpace(spaceData);
        setReviews(reviewsRes?.data || []);
        setRatingSummary(summaryRes);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    if (spaceId) {
      loadData();
    }
  }, [spaceId]);

  const toggleHour = (hour: string) => {
    if (selectedHours.includes(hour)) {
      if (selectedHours.length > 1) {
        setSelectedHours(selectedHours.filter((h) => h !== hour));
      }
    } else {
      setSelectedHours([...selectedHours, hour].sort());
    }
  };

  const durationHours = selectedHours.length;
  const hourlyRate = space?.hargaPerJam || 0;
  const subtotal = hourlyRate * durationHours;
  const facilityFee = 25000;
  const totalInvestment = subtotal + facilityFee;

  const handleContinueBooking = () => {
    const startHour = selectedHours[0] || "09:00";
    router.push(
      `/booking/${spaceId}?tanggal=${selectedDate}&jamMulai=${startHour}&durasi=${durationHours}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="w-6 h-6 text-[#0D5C63] animate-spin" />
          <p className="text-xs font-semibold">Memuat spesifikasi ruangan...</p>
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-slate-900">Ruangan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">{error || "Ruangan ini tidak tersedia atau telah dihapus."}</p>
        <Link
          href="/spaces"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D5C63] hover:bg-[#094348] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>
    );
  }

  const fallbackHero =
    space.tipe === "meeting_room"
      ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
      : space.tipe === "private_office"
      ? "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
      : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80";

  const galleryThumbs = [
    "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
  ];

  const locationText = space.owner?.alamat || "Jl. Kawi Atas No. 24, Klojen, Malang, Jawa Timur";
  const coworkingName = space.owner?.namaCoworking || "WorkNest Hub";

  return (
    <div className="bg-[#fcfdfd] min-h-screen text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 1. BREADCRUMBS & TOP TAGS */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Link href="/spaces" className="hover:text-slate-900">
              Ruangan
            </Link>
            <span>&gt;</span>
            <span>Indonesia</span>
            <span>&gt;</span>
            <span className="font-semibold text-slate-800">{coworkingName}</span>
            <span>&gt;</span>
            <span className="text-slate-900 font-medium truncate max-w-[200px]">{space.namaSpace}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Hub Terverifikasi</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">ID: #SP-{String(space.id).padStart(2, "0")}</span>
          </div>
        </div>

        {/* 2. TITLE & LOCATION BAR */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
              {space.namaSpace} — {coworkingName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1 font-semibold text-slate-900">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>4.96</span>
                <span className="text-slate-400 font-normal">
                  ({reviews.length > 0 ? `${reviews.length} ulasan terverifikasi` : "84 ulasan terverifikasi"})
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{locationText}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Tautan ruangan berhasil disalin!");
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>
          </div>
        </div>

        {/* 3. PHOTO GALLERY */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-2xl overflow-hidden shadow-xs">
          {/* Main Hero Photo */}
          <div className="md:col-span-8 relative aspect-[16/10] bg-slate-100 overflow-hidden">
            <img
              src={space.foto || fallbackHero}
              alt={space.namaSpace}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackHero;
              }}
            />
            <div className="absolute bottom-4 left-4">
              <span className="px-3 py-1 rounded-md text-xs font-medium bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-xs">
                {space.tipe === "meeting_room" ? "Ruang Rapat Eksekutif" : "Area Meja Kerja Pilihan"}
              </span>
            </div>
          </div>

          {/* Sub Photos 2x2 Grid */}
          <div className="md:col-span-4 grid grid-cols-2 gap-3">
            {galleryThumbs.map((thumb, idx) => (
              <div key={idx} className="relative aspect-[4/3] bg-slate-100 overflow-hidden rounded-xl">
                <img src={thumb} alt={`Foto Ruangan ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === 3 && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold">
                    Semua Foto
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. MAIN TWO-COLUMN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          {/* Left Column: Details & Specs */}
          <div className="lg:col-span-8 space-y-8">
            {/* Executive Space Specifications */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
                  Spesifikasi Ruangan Eksekutif
                </h3>
                <span className="text-[11px] font-mono text-slate-400">LUAS: 48 M²</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs">
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kapasitas</span>
                  </span>
                  <p className="font-semibold text-slate-900">{space.kapasitas} Orang Eksekutif</p>
                  <p className="text-[11px] text-slate-500">Kursi putar ergonomis</p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <Tv className="w-3.5 h-3.5 text-slate-400" />
                    <span>Layar / Presentasi</span>
                  </span>
                  <p className="font-semibold text-slate-900">Sony Bravia 4K 85 inci</p>
                  <p className="text-[11px] text-slate-500">HDMI 2.1 / AirPlay / USB-C</p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <Radio className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sistem Audio Video</span>
                  </span>
                  <p className="font-semibold text-slate-900">Polycom Studio X50</p>
                  <p className="text-[11px] text-slate-500">Auto-framing &amp; beamforming mic</p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <Wifi className="w-3.5 h-3.5 text-slate-400" />
                    <span>Koneksi Jaringan</span>
                  </span>
                  <p className="font-semibold text-slate-900">1,2 Gbps Simetris</p>
                  <p className="text-[11px] text-slate-500">Jalur fiber optik berkecepatan tinggi</p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>Akustik Kedap Suara</span>
                  </span>
                  <p className="font-semibold text-slate-900">Isolasi -42 dB</p>
                  <p className="text-[11px] text-slate-500">Kaca ganda peredam suara bising</p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <Coffee className="w-3.5 h-3.5 text-slate-400" />
                    <span>Minuman &amp; Snack</span>
                  </span>
                  <p className="font-semibold text-slate-900">Nespresso Sepuasnya</p>
                  <p className="text-[11px] text-slate-500">Bar air mineral panas &amp; dingin</p>
                </div>
              </div>
            </div>

            {/* About the Space */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-slate-900">Tentang {space.namaSpace}</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {space.deskripsi ||
                  "Dirancang khusus untuk presentasi investor, rapat koordinasi hybrid lintas wilayah, dan rapat pimpinan eksekutif. Menjamin kenyamanan tingkat tinggi dan privasi suara terjaga penuh."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Papan tulis kaca magnetik ultra-lebar 3 meter</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengatur suhu pendingin Daikin mandiri</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dongle layar nirkabel Barco ClickShare</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Paket alat tulis &amp; buku catatan eksekutif</span>
                </div>
              </div>
            </div>

            {/* House Rules & Seamless Access */}
            <div className="space-y-3 pt-2">
              <h3 className="font-serif text-lg font-bold text-slate-900">Tata Tertib &amp; Akses Tanpa Hambatan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Tiket Turnstile QR Otomatis</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Kunci akses terenkripsi terbit tepat 15 menit sebelum waktu pemesanan untuk membuka pintu masuk otomatis.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Wi-Fi Otomatis Tanpa Ribet</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Kredensial WPA3 Enterprise langsung terhubung ke ponsel begitu Anda melewati gerbang masuk ruangan.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Protokol Udara Bersih Bebas Asap</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Lingkungan 100% bebas asap rokok di dalam ruangan. Area taman terbuka tersedia di lantai 2 untuk istirahat.
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Arrival */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-slate-900">Lokasi &amp; Petunjuk Kedatangan</h3>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-cyan-700 hover:text-cyan-900 inline-flex items-center gap-1"
                >
                  <span>Buka di Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-500">{locationText}</p>
              <div className="w-full h-44 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                <div className="text-center space-y-1">
                  <MapPin className="w-6 h-6 mx-auto text-cyan-700" />
                  <p className="font-semibold text-slate-800">{coworkingName}</p>
                  <p className="text-[11px] text-slate-400">Tersedia parkir kendaraan mandiri &amp; valet di Basement B1 &amp; B2</p>
                </div>
              </div>
            </div>

            {/* Verified Member Reviews */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">Ulasan Member Terverifikasi</h3>
                  <p className="text-xs text-slate-500">Dari pimpinan tim dan eksekutif yang pernah memesan ruangan ini</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold font-mono text-slate-900">4.96</span>
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[11px] text-slate-700">
                        RH
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Raditya Harsono</p>
                        <p className="text-[10px] text-slate-400">Chief Technology Officer, Antara Labs • 18 Okt 2024</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Member Terverifikasi
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Sesi OKR tim engineering berjalan sangat lancar dengan peserta remote dari Singapura dan Tokyo. Audio tracking Polycom Studio bekerja sempurna, dan insulasi akustik ruangan sangat kedap.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[11px] text-slate-700">
                        AL
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Anindita Larasati</p>
                        <p className="text-[10px] text-slate-400">Managing Director, Bromo Ventures • 02 Okt 2024</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Member Terverifikasi
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Tiket QR langsung masuk ke WhatsApp membuat kedatangan 10 tamu investor sangat rapi tanpa perlu antre. Staf resepsionis juga sigap menyiapkan espresso hangat sesuai pesanan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget (Exact Image 4) */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm shadow-slate-100">
              {/* Rate & Availability */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-serif text-2xl font-bold text-slate-900 font-mono">
                    {formatRupiah(space.hargaPerJam)}
                  </span>
                  <span className="text-xs text-slate-500 font-normal"> / jam</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Tersedia Hari Ini</span>
                </span>
              </div>

              {/* Date Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>TANGGAL</span>
                  <label htmlFor="date-input" className="text-cyan-700 hover:text-cyan-900 cursor-pointer">
                    UBAH TANGGAL
                  </label>
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    id="date-input"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0D5C63] cursor-pointer"
                  />
                </div>
              </div>

              {/* Select Duration Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>PILIH JAM SESI</span>
                  <span className="text-cyan-800 font-bold">{durationHours} Jam Dipilih</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedHours.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleHour(slot)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                          isSelected
                            ? "bg-cyan-50 border-cyan-600 text-cyan-900 shadow-2xs font-bold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 font-medium pt-1">
                  Sesi berkelanjutan: {selectedHours[0] || "09:00"} —{" "}
                  {selectedHours[selectedHours.length - 1] || "17:00"} ({durationHours} jam)
                </p>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>
                    {durationHours} Jam × {formatRupiah(space.hargaPerJam)}
                  </span>
                  <span className="font-mono text-slate-900">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Biaya Fasilitas &amp; Pemeliharaan</span>
                  <span className="font-mono text-slate-900">{formatRupiah(facilityFee)}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Total Pembayaran</span>
                  <span className="font-serif text-lg font-bold text-cyan-900 font-mono">
                    {formatRupiah(totalInvestment)}
                  </span>
                </div>
              </div>

              {/* Action CTA Button */}
              <button
                type="button"
                onClick={handleContinueBooking}
                className="w-full py-3 px-4 bg-[#0D5C63] hover:bg-[#094348] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md shadow-cyan-950/10 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Lanjutkan Pemesanan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Security note */}
              <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                Tiket QR terenkripsi dikirimkan langsung via WhatsApp &amp; email begitu reservasi terkonfirmasi. Tanpa perlu antre kartu fisik.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
