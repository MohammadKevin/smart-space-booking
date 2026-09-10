"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSpaces, Space } from "@/lib/api";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Wifi,
  Coffee,
  ChevronDown,
  Plus,
  Minus,
  Building2,
  Loader2,
  CreditCard,
  Users,
  Cpu,
  Armchair,
  Radio,
  VolumeX,
  Check,
  Monitor,
} from "lucide-react";

import { formatRupiah } from "@/lib/utils";

function RealSpaceCard({ space }: { space: Space }) {
  const fallbackImage =
    space.tipe === "meeting_room"
      ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
      : space.tipe === "private_office"
      ? "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
      : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80";

  const getStatusBadge = () => {
    if (space.tipe === "desk") {
      return { label: "Turnstile Otomatis", ping: true, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    }
    if (space.tipe === "meeting_room") {
      return { label: "Siap Digunakan", ping: false, color: "text-cyan-700 bg-cyan-50 border-cyan-200" };
    }
    return { label: "Akses NFC Instan", ping: false, color: "text-indigo-700 bg-indigo-50 border-indigo-200" };
  };

  const status = getStatusBadge();
  const locationText = space.owner?.alamat || space.owner?.namaCoworking || "WorkNest Mitra Hub";

  return (
    <div className="bg-white rounded-xs border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all">
      <div>
        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
          <img
            src={space.foto || fallbackImage}
            alt={space.namaSpace}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />
          
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-semibold bg-white/95 backdrop-blur-xs border shadow-2xs ${status.color}`}>
              <span>{status.label}</span>
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-xs text-slate-800 border border-slate-200 shadow-2xs">
              <Users className="w-3 h-3 text-slate-500" />
              <span>{space.kapasitas} Orang</span>
            </span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1 truncate pr-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{locationText}</span>
            </div>
            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 shrink-0">
              ID #SP-{String(space.id).padStart(2, "0")}
            </span>
          </div>

          <h3 className="font-serif text-lg font-bold text-slate-900 leading-tight">
            {space.namaSpace}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {space.deskripsi || "Workstation representatif dengan fasilitas lengkap dan konektivitas prima."}
          </p>

          <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-cyan-600" />
              <span>WiFi Gigabit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Armchair className="w-3 h-3 text-cyan-600" />
              <span>Kursi Ergonomis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-cyan-600" />
              <span>Kunci Digital QR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coffee className="w-3 h-3 text-cyan-600" />
              <span>Free-flow Kopi</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-white">
        <div>
          <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wide">
            Tarif Sewa
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-900 font-mono">
              {formatRupiah(space.hargaPerJam)}
            </span>
            <span className="text-xs text-slate-500">/ jam</span>
          </div>
        </div>
        <Link
          href={`/booking/${space.id}`}
          className="px-4 py-1.5 rounded-lg bg-[#0D5C63] hover:bg-[#094348] text-xs font-semibold text-white transition-colors shadow-2xs"
        >
          {space.tipe === "meeting_room" ? "Pesan Ruangan" : "Pesan Kursi"}
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const dateOptions = useMemo(() => {
    const dates: Array<{ label: string; value: string }> = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayName =
        i === 0
          ? "Hari Ini"
          : i === 1
          ? "Besok"
          : d.toLocaleDateString("id-ID", { weekday: "long" });
      const label = `${dayName}, ${d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })}`;
      dates.push({ label, value: iso });
    }
    return dates;
  }, []);

  const [activeTab, setActiveTab] = useState<"flex" | "meeting" | "suite" | "all">("all");
  const [selectedCity, setSelectedCity] = useState("Semua Kota");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [selectedDuration, setSelectedDuration] = useState("Seharian (09:00 - 18:00)");

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function loadSpaces() {
      setLoading(true);
      setFetchError(false);
      try {
        const data = await getSpaces();
        setSpaces(data || []);
      } catch (err) {
        console.error("Gagal memuat data ruangan dari API:", err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    loadSpaces();
  }, []);

  const deskSpaces = useMemo(() => spaces.filter((s) => s.tipe === "desk"), [spaces]);
  const meetingSpaces = useMemo(() => spaces.filter((s) => s.tipe === "meeting_room"), [spaces]);
  const officeSpaces = useMemo(() => spaces.filter((s) => s.tipe === "private_office"), [spaces]);

  const minDeskRate = useMemo(() => {
    if (deskSpaces.length === 0) return 0;
    return Math.min(...deskSpaces.map((s) => s.hargaPerJam));
  }, [deskSpaces]);

  const minMeetingRate = useMemo(() => {
    if (meetingSpaces.length === 0) return 0;
    return Math.min(...meetingSpaces.map((s) => s.hargaPerJam));
  }, [meetingSpaces]);

  const minOfficeRate = useMemo(() => {
    if (officeSpaces.length === 0) return 0;
    return Math.min(...officeSpaces.map((s) => s.hargaPerJam));
  }, [officeSpaces]);

  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    spaces.forEach((s) => {
      const addr = s.owner?.alamat || s.owner?.namaCoworking;
      if (addr) {
        const parts = addr.split(",");
        const cityName = parts[parts.length - 1]?.trim() || addr.trim();
        if (cityName) citySet.add(cityName);
      }
    });
    return Array.from(citySet);
  }, [spaces]);

  const displayedSpaces = useMemo(() => {
    let result = spaces;

    if (activeTab === "flex") {
      result = result.filter((s) => s.tipe === "desk");
    } else if (activeTab === "meeting") {
      result = result.filter((s) => s.tipe === "meeting_room");
    } else if (activeTab === "suite") {
      result = result.filter((s) => s.tipe === "private_office");
    }

    if (selectedCity && selectedCity !== "Semua Kota") {
      const q = selectedCity.toLowerCase().trim();
      result = result.filter((s) => {
        const addr = (s.owner?.alamat || s.owner?.namaCoworking || "").toLowerCase();
        return addr.includes(q);
      });
    }

    return result;
  }, [spaces, activeTab, selectedCity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (activeTab === "flex") params.set("tipe", "desk");
    else if (activeTab === "meeting") params.set("tipe", "meeting_room");
    else if (activeTab === "suite") params.set("tipe", "private_office");

    if (selectedCity && selectedCity !== "Semua Kota") {
      params.set("search", selectedCity);
      params.set("metro", selectedCity);
    }

    if (selectedDate) {
      params.set("date", selectedDate);
    }

    if (selectedDuration) {
      params.set("duration", selectedDuration);
    }

    router.push(`/spaces?${params.toString()}`);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Bagaimana cara kerja kunci digital IoT instan?",
      a: "Setelah pembayaran dikonfirmasi, sistem kami secara otomatis menghasilkan kode QR kriptografis yang dinamis serta otorisasi NFC pada perangkat Anda. Saat tiba di turnstile atau pintu ruangan rapat, cukup pindai atau dekatkan ponsel untuk membuka akses dalam waktu kurang dari 1,2 detik tanpa perlu melapor ke resepsionis.",
    },
    {
      q: "Apakah saya bisa memesan hitungan jam tanpa langganan bulanan?",
      a: "Tentu saja. WorkNest beroperasi dengan skema fleksibel tanpa komitmen jangka panjang. Anda bisa memesan flex desk maupun ruang rapat mulai dari 1 jam saja, dengan pencatatan menit yang akurat. Ruang kerja privat bulanan juga tersedia sesuai kebutuhan tim Anda.",
    },
    {
      q: "Bagaimana kebijakan pembatalan dan penjadwalan ulang?",
      a: "Rencana dapat berubah sewaktu-waktu. Anda dapat membatalkan atau mengubah jadwal reservasi langsung dari portal dashboard hingga 1 jam sebelum sesi dimulai dengan pengembalian dana 100% instan.",
    },
    {
      q: "Apakah tersedia faktur pajak resmi untuk keperluan perusahaan?",
      a: "Ya. Setiap transaksi dilengkapi dengan bukti pembayaran resmi dan dukungan e-Faktur Pajak dengan mencantumkan NPWP dan nama instansi perusahaan Anda. Riwayat transaksi dapat diunduh dalam format PDF atau CSV kapan saja.",
    },
  ];

  return (
    <div className="bg-white min-h-screen text-slate-900 selection:bg-[#0D5C63] selection:text-white">
      <section id="home" className="pt-10 pb-16 lg:pt-14 lg:pb-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-9">
          <div className="max-w-3xl mx-auto text-center space-y-4 pt-8">
            <h1 className="font-serif text-[48px] sm:text-[48px] md:text-[48px] lg:text-[54px] font-semibold text-slate-900 tracking-tight leading-[1.12]">
              Ruang kerja siap pakai <br /> kapan saja
            </h1>
            <h2 className="text-xs sm:text-sm md:text-[15px] text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Temukan ruang kerja ideal sesuai kebutuhan Anda, mulai dari meja fleksibel, ruang meeting, hingga kantor privat. Cukup pilih lokasi, tanggal, dan durasi. Semua proses, mulai dari pemesanan hingga akses masuk, dapat dilakukan secara instan melalui perangkat Anda.
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xs border border-slate-200 shadow-sm shadow-slate-100 p-2 sm:p-3">
              <div className="flex items-center gap-1 sm:gap-2 px-2 pt-1 pb-3 overflow-x-auto text-xs border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "all"
                      ? "bg-[#006370] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Semua ({spaces.length > 0 ? spaces.length : "Ruangan"})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("flex")}
                  className={`px-3.5 py-1.5 rounded-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "flex"
                      ? "bg-[#006370] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Flex Desk
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("meeting")}
                  className={`px-3.5 py-1.5 rounded-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "meeting"
                      ? "bg-[#006370] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Ruang Rapat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("suite")}
                  className={`px-3.5 py-1.5 rounded-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "suite"
                      ? "bg-[#006370] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Suite Privat
                </button>
              </div>

              <form
                onSubmit={handleSearchSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 p-2 sm:p-3 items-center text-left"
              >
                <div className="lg:col-span-4 border-b sm:border-b-0 sm:border-r border-slate-100 pb-2 sm:pb-0 sm:pr-3">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#006370]" />
                    <span>Kota / Lokasi</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 focus:outline-none cursor-pointer py-1 pr-6 truncate appearance-none"
                    >
                      <option value="Semua Kota">Semua Kota</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-2 pointer-events-none" />
                  </div>
                </div>

                <div className="lg:col-span-3 border-b sm:border-b-0 sm:border-r border-slate-100 pb-2 sm:pb-0 sm:pr-3">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#006370]" />
                    <span>Tanggal</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 focus:outline-none cursor-pointer py-1 pr-6 truncate appearance-none"
                    >
                      {dateOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-2 pointer-events-none" />
                  </div>
                </div>

                <div className="lg:col-span-3 border-b sm:border-b-0 lg:border-r border-slate-100 pb-2 sm:pb-0 sm:pr-3">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#006370]" />
                    <span>Durasi</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 focus:outline-none cursor-pointer py-1 pr-6 truncate appearance-none"
                    >
                      <option value="Seharian (09:00 - 18:00)">Seharian (09:00 - 18:00)</option>
                      <option value="Pagi (09:00 - 13:00)">Pagi (09:00 - 13:00)</option>
                      <option value="Siang (13:00 - 18:00)">Siang (13:00 - 18:00)</option>
                      <option value="Per Jam (2 Jam Sesi)">Per Jam (2 Jam Sesi)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-2 pointer-events-none" />
                  </div>
                </div>

                <div className="lg:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-3 bg-[#006370] hover:bg-[#004e58] text-white text-xs font-bold rounded-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap"
                  >
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span>Cari Ruangan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="max-w-4xl mx-auto pt-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
                {spaces.length > 0 ? `${spaces.length}+` : "48+"}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                Ruangan Terverifikasi di 14 Kota
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
                  89.98%
                </span>
                <span className="text-emerald-500 text-sm font-bold">↑</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                Uptime Kunci Pintar IoT
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
                1.500+
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                Engineer &amp; Founder Bergabung
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
                &lt; 1.2s
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                Buka Pintu via NFC / QR
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="instant-rates" className="border-b border-slate-200/80 bg-slate-50/60 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6 text-xs text-slate-600">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500 uppercase shadow-2xs">
              TARIF INSTAN
            </span>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              <span>
                <strong className="font-semibold text-slate-800">Flex Desks:</strong> {deskSpaces.length > 0 ? <>mulai {formatRupiah(minDeskRate)}/jam</> : "Segera hadir"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              <span>
                <strong className="font-semibold text-slate-800">Ruang Rapat:</strong> {meetingSpaces.length > 0 ? <>mulai {formatRupiah(minMeetingRate)}/jam</> : "Segera hadir"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>
                <strong className="font-semibold text-slate-800">Suite Privat:</strong> {officeSpaces.length > 0 ? <>mulai {formatRupiah(minOfficeRate)}/jam</> : "Segera hadir"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>
                <strong className="font-semibold text-slate-800">Ruang Event:</strong> Paket Khusus
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="ruang-kerja" className="py-14 sm:py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-cyan-700 tracking-wider uppercase">
                DIRANCANG UNTUK PRODUKTIVITAS
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
                Tersedia hari ini untuk pemesanan instan
              </h2>
            </div>

            <Link
              href="/spaces"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <span>Lihat semua {spaces.length > 0 ? `${spaces.length} ` : ""}ruangan di seluruh Indonesia</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xs border border-slate-200 overflow-hidden shadow-xs animate-pulse space-y-3"
                >
                  <div className="aspect-[16/10] bg-slate-200/70" />
                  <div className="p-5 space-y-3">
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
          ) : fetchError ? (
            <div className="p-10 text-center bg-white rounded-xs border border-rose-200 space-y-3">
              <Building2 className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">Gagal Memuat Data Ruangan</p>
              <p className="text-xs text-slate-500">
                Server API sedang tidak merespons atau koneksi terputus. Silakan coba lagi.
              </p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setFetchError(false);
                  getSpaces()
                    .then((data) => setSpaces(data || []))
                    .catch(() => setFetchError(true))
                    .finally(() => setLoading(false));
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D5C63] hover:bg-[#094348] text-white text-xs font-semibold rounded-xs transition-colors"
              >
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : displayedSpaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayedSpaces.slice(0, 6).map((space) => (
                <RealSpaceCard key={space.id} space={space} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/60 rounded-xs border border-slate-200 space-y-4 w-full mx-auto">
              <div className="w-12 h-12 rounded-xs bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Belum Ada Ruangan Terdaftar
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Database inventaris saat ini belum memiliki ruangan yang aktif. Daftarkan ruangan coworking Anda atau buka katalog lengkap.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/register?role=owner"
                  className="px-4 py-2 bg-[#0D5C63] hover:bg-[#094348] text-white text-xs font-semibold rounded-xs transition-colors shadow-xs"
                >
                  Daftar Sebagai Space Owner
                </Link>
                <Link
                  href="/spaces"
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xs transition-colors"
                >
                  Buka Katalog
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="tarif" className="py-14 sm:py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-2">
            <p className="text-[11px] font-bold text-cyan-700 tracking-wider uppercase">
              TARIF WORKNEST
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
              Harga transparan untuk setiap kebutuhan Anda.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              Tanpa biaya tersembunyi. Semua harga sudah termasuk pajak dan biaya layanan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xs border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xs bg-cyan-50 border border-cyan-100/70 text-cyan-700 flex items-center justify-center">
                    <Armchair className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-xs bg-cyan-50 border border-cyan-100 text-cyan-700 uppercase">Populer</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Flex Desk</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Meja kerja ergonomis di area open space dengan akses WiFi dan fasilitas bersama.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  {deskSpaces.length > 0 ? (
                    <>
                      <span className="text-2xl font-bold font-mono text-slate-900">{formatRupiah(minDeskRate)}</span>
                      <span className="text-xs text-slate-400">/jam</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-slate-400">Belum ada ruangan tersedia</span>
                  )}
                </div>
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>WiFi kecepatan tinggi</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Kursi ergonomis</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Akses loker pribadi</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Kopi & teh gratis</span>
                  </div>
                </div>
              </div>
              <Link href="/spaces?tipe=desk" className={`w-full py-2.5 px-4 text-white text-xs font-semibold rounded-xs transition-colors shadow-xs text-center ${deskSpaces.length > 0 ? "bg-[#006370] hover:bg-[#004e58]" : "bg-slate-300 pointer-events-none"}`}>
                Pesan Flex Desk
              </Link>
            </div>

            <div className="bg-white rounded-xs border-2 border-[#006370] p-6 flex flex-col justify-between space-y-5 relative shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xs bg-cyan-50 border border-cyan-100/70 text-cyan-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-xs bg-[#006370] text-white uppercase">Rekomendasi</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Ruang Rapat</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Ruang meeting privat dengan layar presentasi, whiteboard, dan koneksi video call.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  {meetingSpaces.length > 0 ? (
                    <>
                      <span className="text-2xl font-bold font-mono text-slate-900">{formatRupiah(minMeetingRate)}</span>
                      <span className="text-xs text-slate-400">/jam</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-slate-400">Belum ada ruangan tersedia</span>
                  )}
                </div>
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Kapasitas 4–12 orang</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Layar presentasi 4K</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Whiteboard & alat tulis</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Kedap suara</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Kopi, teh & air mineral</span>
                  </div>
                </div>
              </div>
              <Link href="/spaces?tipe=meeting_room" className={`w-full py-2.5 px-4 text-white text-xs font-semibold rounded-xs transition-colors shadow-xs text-center ${meetingSpaces.length > 0 ? "bg-[#006370] hover:bg-[#004e58]" : "bg-slate-300 pointer-events-none"}`}>
                Pesan Ruang Rapat
              </Link>
            </div>

            <div className="bg-white rounded-xs border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xs bg-cyan-50 border border-cyan-100/70 text-cyan-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-xs bg-amber-50 border border-amber-200 text-amber-700 uppercase">Premium</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Suite Privat</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Kantor privat eksklusif dengan kunci digital, meja eksekutif, dan fasilitas lengkap.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  {officeSpaces.length > 0 ? (
                    <>
                      <span className="text-2xl font-bold font-mono text-slate-900">{formatRupiah(minOfficeRate)}</span>
                      <span className="text-xs text-slate-400">/jam</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-slate-400">Belum ada ruangan tersedia</span>
                  )}
                </div>
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Ruangan privat terkunci</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Meja & kursi eksekutif</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Monitor eksternal</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Kedap suara penuh</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Akses 24 jam</span>
                  </div>
                </div>
              </div>
              <Link href="/spaces?tipe=private_office" className={`w-full py-2.5 px-4 text-white text-xs font-semibold rounded-xs transition-colors shadow-xs text-center ${officeSpaces.length > 0 ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300 pointer-events-none"}`}>
                Pesan Suite Privat
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="protocol" className="py-14 sm:py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-2">
            <p className="text-[11px] font-bold text-cyan-700 tracking-wider uppercase">
              STANDAR TEKNOLOGI WORKNEST
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
              Akses instan tanpa antrean meja resepsionis.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              Tanpa kartu fisik atau formulir manual. Seluruh alur reservasi, pintu masuk, dan penagihan dikendalikan langsung lewat perangkat Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white rounded-xs border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-colors">
              <div className="space-y-3.5">
                <div className="w-9 h-9 rounded-xs bg-cyan-50 border border-cyan-100/70 text-cyan-700 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Kunci Digital IoT Instan
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pesan kursi sesaat sebelum tiba, pindai barcode QR dinamis pada turnstile atau gagang pintu. Kunci magnetik otomatis terbuka dalam 1,2 detik.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400">Protokol: BLE 5.2 / NFC</span>
                <span className="font-semibold text-cyan-700">Instan</span>
              </div>
            </div>

            <div className="bg-white rounded-xs border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-colors">
              <div className="space-y-3.5">
                <div className="w-9 h-9 rounded-xs bg-cyan-50 border border-cyan-100/70 text-cyan-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Pembayaran Akurat Per Jam
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hanya bayar waktu yang Anda gunakan. Butuh phone booth untuk panggilan klien 30 menit? Perhitungan tarif otomatis tanpa biaya siluman.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400">Pembayaran: QRIS &amp; Virtual Account</span>
                <span className="font-semibold text-cyan-700">Otomatis</span>
              </div>
            </div>

            <div className="bg-white rounded-xs border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-colors">
              <div className="space-y-3.5">
                <div className="w-9 h-9 rounded-xs bg-cyan-50 border border-cyan-100/70 text-cyan-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Kontrol Tim &amp; Perusahaan Terpusat
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kelola 50 rekan kerja remote di berbagai kota dalam satu akun grup. Tentukan batas anggaran bulanan dan pantau laporan okupansi secara langsung.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400">Enterprise: SAML / Slack</span>
                <span className="font-semibold text-cyan-700">Enterprise</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xs border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>14 Hub Metropolitan</span>
                </span>

                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight leading-tight">
                  Tersedia di mana pun tim Anda siap berkolaborasi.
                </h2>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                  Dari gedung perkantoran di Jakarta Selatan hingga coworking asri di Bandung dan Malang. Satu akun digital membuka seluruh akses hub kami.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    href="/spaces"
                    className="px-4 py-2 rounded-xs bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-2xs"
                  >
                    Buka Peta &amp; Katalog
                  </Link>
                  <Link
                    href="/register?role=owner"
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Daftarkan ruangan Anda</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 bg-slate-50/80 rounded-xs border border-slate-200/80 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Topologi Jaringan Hub Aktif</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Sinkronisasi v2.4</span>
                </div>

                <div className="p-4 bg-white rounded-xs border border-slate-200/90 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Total Ruangan Terverifikasi</span>
                    <span className="font-mono font-bold text-cyan-800">{spaces.length > 0 ? `${spaces.length} Ruangan Aktif` : "Katalog Ruangan"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Cakupan Wilayah</span>
                    <span>{availableCities.length > 0 ? availableCities.join(", ") : "14 Kota Indonesia"}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center font-normal pt-1">
                  Jangkauan: Jabodetabek · Surabaya · Malang · Bandung · Bali
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-14 sm:py-20 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1.5">
            <p className="text-[11px] font-bold text-cyan-700 tracking-wider uppercase">
              PERTANYAAN UMUM
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Pertanyaan yang sering diajukan
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xs border border-slate-200/90 bg-white transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer focus:outline-none"
                  >
                    <span className="text-xs sm:text-[13px] font-semibold text-slate-800">
                      {faq.q}
                    </span>
                    <span className="text-slate-400 hover:text-slate-700 shrink-0">
                      {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xs border border-slate-200/90 bg-white p-8 sm:p-12 text-center space-y-5 shadow-2xs">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight leading-tight">
              Siap meningkatkan produktivitas tim Anda hari ini?
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
              Bergabung bersama ribuan founder, developer, dan pekerja kreatif yang telah menggunakan ekosistem WorkNest.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/spaces"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xs bg-[#0D5C63] hover:bg-[#094348] text-white text-xs sm:text-[13px] font-semibold transition-colors shadow-xs"
              >
                Pesan Ruangan Sekarang
              </Link>
              <Link
                href="/register?role=owner"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xs border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-[13px] font-semibold transition-colors"
              >
                Daftar Sebagai Pengelola Ruangan
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}