"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSpaces, Space } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faLocationDot,
  faClock,
  faArrowRight,
  faStar,
  faWifi,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faPlus,
  faMinus,
  faBuilding,
  faUsers,
  faChair,
  faCheck,
  faKey,
  faHeart as faHeartSolid,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";

import { formatRupiah } from "@/lib/utils";
import { SearchDatePicker } from "@/components/SearchDatePicker";
import { SearchTimePicker } from "@/components/SearchTimePicker";

function HeroWorkspaceCard() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);

  const items = [
    {
      type: "Ruang Rapat",
      title: "Boardroom Sudirman",
      location: "SCBD Tower, Jakarta Selatan",
      image:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
      rate: "Rp 150.000 / jam",
      capacity: "10 Orang",
      rating: "4.9",
    },
    {
      type: "Focus Pod",
      title: "Private Studio Pod",
      location: "Kuningan City, Jakarta",
      image:
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80",
      rate: "Rp 45.000 / jam",
      capacity: "1-2 Orang",
      rating: "4.9",
    },
    {
      type: "Flex Desk",
      title: "Open Workstation",
      location: "Senopati Hub, Jakarta",
      image:
        "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1000&q=80",
      rate: "Rp 25.000 / jam",
      capacity: "1 Orang",
      rating: "4.8",
    },
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % items.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused, items.length]);

  return (
    <div
      className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative aspect-[4/3] w-full rounded-xl bg-slate-100 overflow-hidden group">
        <div
          className="flex w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeTab * 100}%)` }}
        >
          {items.map((item, idx) => (
            <div key={idx} className="w-full h-full shrink-0 relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setActiveTab((prev) => (prev === 0 ? items.length - 1 : prev - 1))
          }
          aria-label="Foto Sebelumnya"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs opacity-80 hover:opacity-100"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab((prev) => (prev + 1) % items.length)}
          aria-label="Foto Berikutnya"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs opacity-80 hover:opacity-100"
        >
          <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
        </button>

        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pointer-events-auto">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveTab(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`transition-all rounded-full cursor-pointer ${
                activeTab === idx
                  ? "w-4 h-1.5 bg-white shadow-xs"
                  : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RealSpaceCardProps {
  space: Space;
  selectedDate?: string;
  jamMulai?: string;
  durasiJam?: number;
}

function RealSpaceCard({
  space,
  selectedDate,
  jamMulai,
  durasiJam,
}: RealSpaceCardProps) {
  const [saved, setSaved] = useState(false);

  const fallbackImage =
    space.tipe === "meeting_room"
      ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80"
      : space.tipe === "private_office"
      ? "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80"
      : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1000&q=80";

  const typeLabel =
    space.tipe === "meeting_room"
      ? "Ruang Rapat"
      : space.tipe === "private_office"
      ? "Suite Privat"
      : "Flex Desk";

  const ownerName = space.owner?.namaCoworking || "WorkNest Hub";
  const locationText = space.owner?.alamat || ownerName;
  const rating = (4.7 + ((Number(space.id) * 3) % 3) / 10).toFixed(1);

  const bookingHref = selectedDate
    ? `/booking/${space.id}?date=${selectedDate}&jamMulai=${jamMulai || "09:00"}&durasiJam=${durasiJam || 9}`
    : `/booking/${space.id}`;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all duration-200">
      <div>
        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
          <img
            src={space.foto || fallbackImage}
            alt={space.namaSpace}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />
        </div>

        <div className="p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium truncate max-w-[150px]">{ownerName}</span>
            <div className="flex items-center gap-1 font-bold text-slate-800">
              <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-amber-400" />
              <span>{rating}</span>
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors line-clamp-1">
            {space.namaSpace}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600">
              <FontAwesomeIcon icon={faUsers} className="w-3 h-3 text-sky-600" />
              {space.kapasitas} Orang
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600">
              <FontAwesomeIcon icon={faWifi} className="w-3 h-3 text-sky-600" />
              WiFi
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 border border-sky-100 text-xs font-medium text-sky-800">
              <FontAwesomeIcon icon={faKey} className="w-3 h-3 text-sky-600" />
              Kunci QR
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block">Tarif</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-900 font-mono">
              {formatRupiah(space.hargaPerJam)}
            </span>
            <span className="text-xs text-slate-500">/ jam</span>
          </div>
        </div>

        <Link
          href={bookingHref}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all ${
            space.isAvailable === false
              ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
              : "bg-sky-600 hover:bg-sky-500 text-white"
          }`}
        >
          <span>{space.isAvailable === false ? "Cek Slot" : "Pesan"}</span>
          <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"all" | "flex" | "meeting" | "suite">("all");
  const [selectedCity, setSelectedCity] = useState("Semua Kota");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [selectedDuration, setSelectedDuration] = useState("Seharian (09:00 - 18:00)");
  const [selectedJamMulai, setSelectedJamMulai] = useState("09:00");
  const [selectedDurasiJam, setSelectedDurasiJam] = useState(9);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function loadSpaces() {
      setLoading(true);
      setFetchError(false);
      try {
        const data = await getSpaces({
          tanggal: selectedDate,
          jamMulai: selectedJamMulai,
          durasiJam: selectedDurasiJam,
          duration: selectedDuration,
        });
        setSpaces(data || []);
      } catch (err) {
        console.error("Gagal memuat data ruangan dari API:", err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    loadSpaces();
  }, [selectedDate, selectedJamMulai, selectedDurasiJam, selectedDuration]);

  const deskSpaces = useMemo(() => spaces.filter((s) => s.tipe === "desk"), [spaces]);
  const meetingSpaces = useMemo(() => spaces.filter((s) => s.tipe === "meeting_room"), [spaces]);
  const officeSpaces = useMemo(() => spaces.filter((s) => s.tipe === "private_office"), [spaces]);

  const minDeskRate = useMemo(() => {
    if (deskSpaces.length === 0) return 25000;
    return Math.min(...deskSpaces.map((s) => s.hargaPerJam));
  }, [deskSpaces]);

  const minMeetingRate = useMemo(() => {
    if (meetingSpaces.length === 0) return 150000;
    return Math.min(...meetingSpaces.map((s) => s.hargaPerJam));
  }, [meetingSpaces]);

  const minOfficeRate = useMemo(() => {
    if (officeSpaces.length === 0) return 350000;
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
      params.set("tanggal", selectedDate);
    }

    if (selectedDuration) {
      params.set("duration", selectedDuration);
    }

    if (selectedJamMulai) {
      params.set("jamMulai", selectedJamMulai);
    }

    if (selectedDurasiJam) {
      params.set("durasiJam", selectedDurasiJam.toString());
    }

    router.push(`/spaces?${params.toString()}`);
  };

  const faqs = [
    {
      q: "Bagaimana cara kerja kunci digital untuk masuk ruangan?",
      a: "Setelah pembayaran selesai, kode QR digital otomatis aktif di akun Anda. Pindai kode QR pada turnstile atau pintu ruangan saat tiba di lokasi untuk membuka pintu secara instan.",
    },
    {
      q: "Apakah bisa pesan ruangan hanya untuk beberapa jam?",
      a: "Bisa. WorkNest melayani pemesanan fleksibel per jam untuk meja kerja, ruang meeting, maupun kantor privat tanpa perlu langganan bulanan.",
    },
    {
      q: "Bagaimana jika jadwal saya berubah dan butuh reschedule?",
      a: "Anda dapat membatalkan atau mengubah jadwal langsung dari dashboard akun Anda hingga 1 jam sebelum sesi reservasi dimulai.",
    },
    {
      q: "Apakah disediakan faktur / invoice resmi untuk klaim kantor?",
      a: "Ya. Setiap transaksi secara otomatis menerbitkan invoice resmi dan bukti bayar yang dapat langsung diunduh dalam format PDF.",
    },
    {
      q: "Bagaimana cara mendaftarkan gedung atau coworking space saya?",
      a: "Klik menu 'Daftarkan Ruangan' untuk membuat akun space owner. Tim kami akan membantu integrasi katalog dan perangkat akses ruangan Anda.",
    },
  ];

  return (
    <div className="bg-white min-h-screen text-slate-900">
      <section id="home" className="relative pt-12 pb-14 lg:pb-20 overflow-hidden min-h-[700px] flex flex-col justify-center h-screen min-w-fit">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/1.png"
            alt="WorkNest Workspace Background"
            className="w-full h-full object-cover object-center opacity-45 sm:opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5 text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
                Sewa ruang kerja &amp; meeting <br />
                <span className="text-sky-600">per jam</span> tanpa ribet.
              </h1>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-xl">
                Temukan flex desk, ruang meeting berfasilitas lengkap, dan kantor privat di lokasi strategis. Pesan langsung, bayar via QRIS/VA, dan akses pintu dengan kunci digital tanpa antre di resepsionis.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/spaces"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>Cari Ruangan Sekarang</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                </Link>

                <a
                  href="#tata-cara"
                  className="px-5 py-2.5 rounded-xl bg-white/90 border border-slate-200 hover:bg-white text-slate-700 text-xs sm:text-sm font-semibold transition-colors shadow-sm backdrop-blur-xs"
                >
                  Tata Cara
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <HeroWorkspaceCard />
            </div>
          </div>

          {/* DOCKED SEARCH BAR (LIQUID GLASS EFFECT) */}
          <div className="pt-4">
            <div className="bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-[0_12px_40px_rgba(2,132,199,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-sky-500/10 p-4 sm:p-5">
              <div className="flex items-center gap-1.5 pb-3.5 border-b border-slate-200/50 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === "all"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  Semua Ruangan ({spaces.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("flex")}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === "flex"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <FontAwesomeIcon icon={faChair} className="w-3 h-3" />
                  <span>Flex Desk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("meeting")}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === "meeting"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                  <span>Ruang Rapat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("suite")}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === "suite"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <FontAwesomeIcon icon={faBuilding} className="w-3 h-3" />
                  <span>Suite Privat</span>
                </button>
              </div>

              <form
                onSubmit={handleSearchSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3.5 items-center text-left"
              >
                <div className="lg:col-span-4 border-b sm:border-b-0 sm:border-r border-slate-200/50 pb-2.5 sm:pb-0 sm:pr-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 text-sky-600" />
                    <span>Kota / Area</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none cursor-pointer py-1.5 pr-6 truncate appearance-none"
                    >
                      <option value="Semua Kota">Semua Kota</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 text-slate-400 absolute right-1 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div className="lg:col-span-3 border-b sm:border-b-0 sm:border-r border-slate-200/50 pb-2.5 sm:pb-0 sm:pr-3">
                  <SearchDatePicker value={selectedDate} onChange={setSelectedDate} />
                </div>

                <div className="lg:col-span-3 border-b sm:border-b-0 lg:border-r border-slate-200/50 pb-2.5 sm:pb-0 sm:pr-3">
                  <SearchTimePicker
                    value={selectedDuration}
                    jamMulai={selectedJamMulai}
                    durasiJam={selectedDurasiJam}
                    onChange={(val) => {
                      setSelectedDuration(val.duration);
                      setSelectedJamMulai(val.jamMulai);
                      setSelectedDurasiJam(val.durasiJam);
                    }}
                  />
                </div>

                <div className="lg:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm shadow-sky-600/30"
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3 h-3" />
                    <span>Cari Ruangan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. KATALOG RUANGAN */}
      <section id="ruang-kerja" className="py-14 sm:py-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-sky-600 tracking-wider uppercase">
                KATALOG RUANGAN
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Pilihan Ruang Kerja Tersedia Hari Ini
              </h2>
            </div>

            <Link
              href="/spaces"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
            >
              <span>Lihat semua {spaces.length > 0 ? `(${spaces.length}) ` : ""}ruangan</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-3"
                >
                  <div className="aspect-[16/10] rounded-xl bg-slate-100" />
                  <div className="pt-2 space-y-2.5">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-3.5 bg-slate-100 rounded w-full" />
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <div className="h-5 bg-slate-200 rounded w-1/3" />
                      <div className="h-8 w-20 bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-rose-200 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Gagal Memuat Data Ruangan</p>
              <p className="text-xs text-slate-500">
                Server backend sedang tidak merespons. Silakan coba lagi.
              </p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setFetchError(false);
                  getSpaces({
                    tanggal: selectedDate,
                    jamMulai: selectedJamMulai,
                    durasiJam: selectedDurasiJam,
                    duration: selectedDuration,
                  })
                    .then((data) => setSpaces(data || []))
                    .catch(() => setFetchError(true))
                    .finally(() => setLoading(false));
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : displayedSpaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayedSpaces.slice(0, 6).map((space) => (
                <RealSpaceCard
                  key={space.id}
                  space={space}
                  selectedDate={selectedDate}
                  jamMulai={selectedJamMulai}
                  durasiJam={selectedDurasiJam}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3 max-w-lg mx-auto">
              <p className="text-sm font-bold text-slate-800">Belum Ada Ruangan yang Cocok</p>
              <p className="text-xs text-slate-500">
                Silakan ganti kategori atau filter kota untuk melihat inventaris lainnya.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setSelectedCity("Semua Kota");
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. TATA CARA PEMESANAN */}
      <section id="tata-cara" className="py-14 sm:py-16 border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-sky-600 tracking-wider uppercase">
              ALUR PEMESANAN
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cara Mudah Menggunakan WorkNest
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <span className="text-2xl font-bold font-mono text-sky-600">01</span>
              <h3 className="text-base font-bold text-slate-900">Pilih Ruangan &amp; Waktu</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tentukan tipe ruangan, lokasi kota, tanggal, dan durasi jam sesuai kebutuhan aktivitas Anda.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <span className="text-2xl font-bold font-mono text-sky-600">02</span>
              <h3 className="text-base font-bold text-slate-900">Bayar Instan Online</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Selesaikan pembayaran lewat QRIS, Virtual Account bank, atau kartu kredit secara aman.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <span className="text-2xl font-bold font-mono text-sky-600">03</span>
              <h3 className="text-base font-bold text-slate-900">Pindai QR Masuk Pintu</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buka kunci pintu pintar di lokasi menggunakan kode QR di ponsel Anda tanpa melapor resepsionis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STRUKTUR TARIF */}
      <section id="tarif" className="py-14 sm:py-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-bold text-sky-600 tracking-wider uppercase">
              STRUKTUR TARIF
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tarif Transparan Tanpa Biaya Tersembunyi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Flex Desk */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faChair} className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Solo Work
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">Flex Desk</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Meja kerja di area open-space untuk fokus individu atau remote worker.
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    {formatRupiah(minDeskRate)}
                  </span>
                  <span className="text-xs text-slate-500">/ jam</span>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>WiFi kecepatan tinggi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Kursi ergonomis &amp; power outlet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Akses gratis kopi &amp; teh</span>
                  </div>
                </div>
              </div>

              <Link
                href="/spaces?tipe=desk"
                className="w-full py-2.5 px-4 text-center rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition-colors"
              >
                Pesan Flex Desk
              </Link>
            </div>

            {/* Ruang Rapat */}
            <div className="bg-white rounded-2xl border-2 border-sky-500 p-6 flex flex-col justify-between space-y-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                    <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-sky-600 text-white">
                    Paling Populer
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">Ruang Rapat</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Ruang meeting privat untuk presentasi klien, diskusi tim, dan video call.
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    {formatRupiah(minMeetingRate)}
                  </span>
                  <span className="text-xs text-slate-500">/ jam</span>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Kapasitas 4 hingga 14 orang</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Layar Smart TV 4K &amp; Whiteboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Insulasi dinding kedap suara</span>
                  </div>
                </div>
              </div>

              <Link
                href="/spaces?tipe=meeting_room"
                className="w-full py-2.5 px-4 text-center rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Pesan Ruang Rapat
              </Link>
            </div>

            {/* Suite Privat */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faBuilding} className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Dedicated Tim
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">Suite Privat</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Kantor privat tertutup dengan kunci mandiri untuk tim bisnis &amp; startup.
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    {formatRupiah(minOfficeRate)}
                  </span>
                  <span className="text-xs text-slate-500">/ jam</span>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Ruang privat terkunci smart lock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Akses 24 jam</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Alamat bisnis &amp; penanganan surat</span>
                  </div>
                </div>
              </div>

              <Link
                href="/spaces?tipe=private_office"
                className="w-full py-2.5 px-4 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                Pesan Suite Privat
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section id="faq" className="py-14 sm:py-16 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer focus:outline-none"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {faq.q}
                    </span>
                    <FontAwesomeIcon
                      icon={isOpen ? faMinus : faPlus}
                      className="w-3.5 h-3.5 text-slate-400 shrink-0"
                    />
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
    </div>
  );
}
