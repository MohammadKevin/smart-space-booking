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
} from "lucide-react";

function formatRupiah(amount: number | string | undefined | null): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || 0)) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function RealSpaceCard({ space }: { space: Space }) {
  const fallbackImage =
    space.tipe === "meeting_room"
      ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
      : space.tipe === "private_office"
      ? "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
      : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80";

  const getStatusBadge = () => {
    if (space.tipe === "desk") {
      return { label: "Live Turnstile", ping: true, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    }
    if (space.tipe === "meeting_room") {
      return { label: "Meeting Ready", ping: false, color: "text-cyan-700 bg-cyan-50 border-cyan-200" };
    }
    return { label: "Instant NFC", ping: false, color: "text-indigo-700 bg-indigo-50 border-indigo-200" };
  };

  const status = getStatusBadge();
  const locationText = space.owner?.alamat || space.owner?.namaCoworking || "WorkNest Partner Hub";

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all">
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
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-xs border shadow-2xs ${status.color}`}>
              {status.ping ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              )}
              <span>{status.label}</span>
            </span>
          </div>

          {/* Capacity */}
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-xs text-slate-800 border border-slate-200 shadow-2xs">
              <Users className="w-3 h-3 text-slate-500" />
              <span>{space.kapasitas} Orang</span>
            </span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {/* Location & ID */}
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

          {/* 4 Feature Specs Grid */}
          <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-cyan-600" />
              <span>Gigabit WiFi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Armchair className="w-3 h-3 text-cyan-600" />
              <span>Kursi Ergonomis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-cyan-600" />
              <span>QR Digital Lock</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coffee className="w-3 h-3 text-cyan-600" />
              <span>Free-flow Coffee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Price & Action */}
      <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold text-slate-900 font-mono">
            {formatRupiah(space.hargaPerJam)}
          </span>
          <span className="text-xs text-slate-500">/jam</span>
        </div>
        <Link
          href={`/booking/${space.id}`}
          className="px-4 py-1.5 rounded-lg bg-[#0D5C63] hover:bg-[#094348] text-xs font-semibold text-white transition-colors shadow-2xs"
        >
          {space.tipe === "meeting_room" ? "Reserve Room" : "Reserve Seat"}
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  // Search card state
  const [activeTab, setActiveTab] = useState<"flex" | "meeting" | "suite" | "all">("flex");
  const [selectedCity, setSelectedCity] = useState("Semua Kota");
  const [selectedDate, setSelectedDate] = useState("Today, 24 Oct");
  const [selectedDuration, setSelectedDuration] = useState("Full-day (09:00 - 18:00)");

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Real spaces from API
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

  // Compute dynamic rates from real database spaces
  const deskSpaces = useMemo(() => spaces.filter((s) => s.tipe === "desk"), [spaces]);
  const meetingSpaces = useMemo(() => spaces.filter((s) => s.tipe === "meeting_room"), [spaces]);
  const officeSpaces = useMemo(() => spaces.filter((s) => s.tipe === "private_office"), [spaces]);

  const minDeskRate = useMemo(() => {
    if (deskSpaces.length === 0) return 20000;
    return Math.min(...deskSpaces.map((s) => s.hargaPerJam));
  }, [deskSpaces]);

  const minMeetingRate = useMemo(() => {
    if (meetingSpaces.length === 0) return 50000;
    return Math.min(...meetingSpaces.map((s) => s.hargaPerJam));
  }, [meetingSpaces]);

  const minOfficeRate = useMemo(() => {
    if (officeSpaces.length === 0) return 100000;
    return Math.min(...officeSpaces.map((s) => s.hargaPerJam));
  }, [officeSpaces]);

  // Extract unique cities from real spaces
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

  // Filtered spaces based on selected tab
  const displayedSpaces = useMemo(() => {
    if (activeTab === "flex") {
      const filtered = spaces.filter((s) => s.tipe === "desk");
      return filtered.length > 0 ? filtered : spaces;
    }
    if (activeTab === "meeting") {
      const filtered = spaces.filter((s) => s.tipe === "meeting_room");
      return filtered.length > 0 ? filtered : spaces;
    }
    if (activeTab === "suite") {
      const filtered = spaces.filter((s) => s.tipe === "private_office");
      return filtered.length > 0 ? filtered : spaces;
    }
    return spaces;
  }, [spaces, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (activeTab === "flex") params.set("tipe", "desk");
    else if (activeTab === "meeting") params.set("tipe", "meeting_room");
    else if (activeTab === "suite") params.set("tipe", "private_office");

    if (selectedCity && selectedCity !== "Semua Kota") {
      params.set("search", selectedCity);
    }

    router.push(`/spaces?${params.toString()}`);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How do instant digital IoT keys work?",
      a: "Upon instant booking confirmation, our platform generates a dynamic, time-limited cryptographic QR code and authorized NFC payload directly on your mobile device. When you reach the workspace turnstile or meeting room smart lock, tap or scan to unlock in under 1.2 seconds without checking in at any front desk.",
    },
    {
      q: "Can I book strictly by the hour, or are monthly commitments needed?",
      a: "WorkNest operates on a 100% commitment-free, pay-as-you-go model. You can reserve flex desks and meeting rooms for as brief as an hour, with automatic per-minute billing for overages. Dedicated desks and private suites are also available with flexible rolling monthly terms.",
    },
    {
      q: "What is the cancellation and rescheduling policy?",
      a: "Plans shift quickly. You can cancel or reschedule any reservation directly from your dashboard up to 1 hour prior to your reserved start time for an instant 100% refund credited back to your original payment method or WorkNest balance.",
    },
    {
      q: "Do corporate plans support Indonesian tax invoices (Faktur Pajak)?",
      a: "Yes. Corporate and team plans include automated e-Faktur Pajak generation with your company's NPWP and registered business identity. Consolidated monthly invoices and detailed audit logs can be exported directly to CSV or synced to ERP tools.",
    },
  ];

  return (
    <div className="bg-white min-h-screen text-slate-900 selection:bg-[#0D5C63] selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="pt-10 pb-16 lg:pt-14 lg:pb-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-9">
          {/* Top Announcement Pill */}
          <div className="flex justify-center">
            <Link
              href="/spaces"
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs transition-all hover:scale-[1.01]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
              <span className="font-semibold text-slate-900">WorkNest 2.0</span>
              <span className="text-slate-300">•</span>
              <span>Nationwide Access Pass is live in 14 cities</span>
              <ArrowRight className="w-3 h-3 text-slate-400 ml-0.5" />
            </Link>
          </div>

          {/* Main Headline & Subtitle */}
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-semibold text-slate-900 tracking-tight leading-[1.12]">
              On-demand workspace for focused teams & founders.
            </h1>
            <p className="text-xs sm:text-sm md:text-[15px] text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Book verified ergonomic desks, private soundproof suites, and fiber-connected boardrooms across 14 cities in Indonesia. Instant entry via automated IoT digital pass.
            </p>
          </div>

          {/* Interactive Search Box */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 p-2 sm:p-3">
              {/* Category Tabs */}
              <div className="flex items-center gap-1 sm:gap-2 px-2 pt-1 pb-3 overflow-x-auto text-xs border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("flex")}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === "flex"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Flex Desk
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("meeting")}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === "meeting"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Meeting Room
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("suite")}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === "suite"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Private Suite
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === "all"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Semua Ruangan
                </button>
              </div>

              {/* Form Input Fields */}
              <form
                onSubmit={handleSearchSubmit}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 p-2 sm:p-3 items-center text-left"
              >
                {/* City */}
                <div className="sm:col-span-4 border-b sm:border-b-0 sm:border-r border-slate-100 pb-2 sm:pb-0 sm:pr-3">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>City</span>
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-[13px] font-medium text-slate-900 focus:outline-none cursor-pointer py-1"
                  >
                    <option value="Semua Kota">Semua Kota</option>
                    {availableCities.length > 0 ? (
                      availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Jakarta">Jakarta</option>
                        <option value="Surabaya">Surabaya</option>
                        <option value="Malang">Malang</option>
                        <option value="Bandung">Bandung</option>
                        <option value="Bali">Bali</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Date */}
                <div className="sm:col-span-3 border-b sm:border-b-0 sm:border-r border-slate-100 pb-2 sm:pb-0 sm:pr-3">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Date</span>
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-[13px] font-medium text-slate-900 focus:outline-none cursor-pointer py-1"
                  >
                    <option value="Today, 24 Oct">Today, 24 Oct</option>
                    <option value="Tomorrow, 25 Oct">Tomorrow, 25 Oct</option>
                    <option value="Saturday, 26 Oct">Saturday, 26 Oct</option>
                    <option value="Monday, 28 Oct">Monday, 28 Oct</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="sm:col-span-3 border-b sm:border-b-0 pb-2 sm:pb-0 sm:pr-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Duration</span>
                  </label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-[13px] font-medium text-slate-900 focus:outline-none cursor-pointer py-1"
                  >
                    <option value="Full-day (09:00 - 18:00)">Full-day (09:00 - 18:00)</option>
                    <option value="Half-day Morning (09:00 - 13:00)">Half-day Morning (09:00 - 13:00)</option>
                    <option value="Half-day Afternoon (13:00 - 18:00)">Half-day Afternoon (13:00 - 18:00)</option>
                    <option value="Hourly (2 Hours)">Hourly (2 Hours)</option>
                  </select>
                </div>

                {/* Find Spaces Button */}
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#0D5C63] hover:bg-[#094348] text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Find Spaces</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="max-w-4xl mx-auto pt-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
                {spaces.length > 0 ? `${spaces.length}+` : "420+"}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                Verified Spaces Across 14 Cities
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
                  99.98%
                </span>
                <span className="text-emerald-500 text-sm font-bold">↑</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                Reliable IoT Uptime
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
                15,400+
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                Engineers & Founders
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
                &lt; 1.2s
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                NFC / QR Door Unlock
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INSTANT RATES TICKER BAR */}
      <section id="instant-rates" className="border-b border-slate-200/80 bg-slate-50/60 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6 text-xs text-slate-600">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500 uppercase shadow-2xs">
              INSTANT RATES
            </span>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              <span>
                <strong className="font-semibold text-slate-800">Flex Desks:</strong> from {formatRupiah(minDeskRate)}/hr
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              <span>
                <strong className="font-semibold text-slate-800">Meeting Rooms:</strong> from {formatRupiah(minMeetingRate)}/hr
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>
                <strong className="font-semibold text-slate-800">Private Suites:</strong> from {formatRupiah(minOfficeRate)}/hr
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>
                <strong className="font-semibold text-slate-800">Event Spaces:</strong> Custom Billing
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: ENGINEERED FOR OUTPUT (REAL SPACES ONLY) */}
      <section className="py-14 sm:py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-cyan-700 tracking-wider uppercase">
                ENGINEERED FOR OUTPUT
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
                Available today for frictionless booking
              </h2>
            </div>

            <Link
              href="/spaces"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <span>View all {spaces.length} spaces nationwide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Real Data Space Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-pulse space-y-3"
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
            <div className="p-10 text-center bg-white rounded-xl border border-rose-200 space-y-3">
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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D5C63] hover:bg-[#094348] text-white text-xs font-semibold rounded-lg transition-colors"
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
            <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-slate-200 space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
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
                  className="px-4 py-2 bg-[#0D5C63] hover:bg-[#094348] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  Daftar Sebagai Space Owner
                </Link>
                <Link
                  href="/spaces"
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Buka Katalog
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. SECTION: THE WORKNEST PROTOCOL */}
      <section id="protocol" className="py-14 sm:py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-2">
            <p className="text-[11px] font-bold text-cyan-700 tracking-wider uppercase">
              THE WORKNEST PROTOCOL
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
              Zero front desk friction. Built like modern developer tooling.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              No receptionists, sign-in sheets, No physical membership plastic cards. Everything is orchestrated straight from your phone or CLI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1 */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-colors">
              <div className="space-y-3.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-100/70 text-cyan-700 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Zero-Wait IoT QR Pass
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Book a seat seconds before arriving, tap your mobile audit-screen dynamic QR at the entrance turnstile. Magnetic locks open whisper and elevators automatically.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400">Protocol: BLE 5.2 / NFC</span>
                <span className="font-semibold text-cyan-700">Instant</span>
              </div>
            </div>

            {/* Box 2 */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-colors">
              <div className="space-y-3.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-100/70 text-cyan-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Micro-Invoicing by the Minute
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Only pay for what you occupy. Need an impromptu sound booth for a 35-minute client sync? Billing cuts independently to the minute without bloated rounded blocks.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400">Billing: Zero-commitment Debit</span>
                <span className="font-semibold text-cyan-700">Automated</span>
              </div>
            </div>

            {/* Box 3 */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-colors">
              <div className="space-y-3.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-100/70 text-cyan-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Centralized Team Controls
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provision 50 remote teammates across Bali, Jakarta, and Malang under a shared pool. Set individual monthly spend quotas, and receive realtime utilization audits.
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

      {/* 5. SECTION: COVERAGE INTERACTIVE MAP / HUBS */}
      <section className="py-14 sm:py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left text */}
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>14 Metro Hubs</span>
                </span>

                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight leading-tight">
                  Available wherever your team chooses to ship code.
                </h2>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                  From high-rise towers in Mega Kuningan to quiet villas in Canggu and heritage villas in Malang. One digital account unlocks them all.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    href="/spaces"
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-2xs"
                  >
                    Browse Interactive Map
                  </Link>
                  <Link
                    href="/register?role=owner"
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Place your own space</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Right Radar / Telemetry graphic */}
              <div className="lg:col-span-6 bg-slate-50/80 rounded-xl border border-slate-200/80 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Live Network Topology</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Mesh Sync v2.4</span>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200/90 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Total Ruangan Terverifikasi</span>
                    <span className="font-mono font-bold text-cyan-800">{spaces.length} Ruangan Aktif</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Cakupan Wilayah</span>
                    <span>{availableCities.length > 0 ? availableCities.join(", ") : "14 Kota Indonesia"}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center font-normal pt-1">
                  Coverage: Greater Jakarta · Surabaya · Malang · Bandung · Denpasar
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: CLARIFICATIONS / FAQ */}
      <section id="faq" className="py-14 sm:py-20 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1.5">
            <p className="text-[11px] font-bold text-cyan-700 tracking-wider uppercase">
              CLARIFICATIONS
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Frequently asked operational questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200/90 bg-white transition-all"
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

      {/* 7. SECTION: CTA BANNER */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-12 text-center space-y-5 shadow-2xs">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight leading-tight">
              Ready to streamline how your distributed team works?
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
              Join over 15,000 founders, engineers, and remote operators booking spaces on WorkNest today.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/spaces"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#0D5C63] hover:bg-[#094348] text-white text-xs sm:text-[13px] font-semibold transition-colors shadow-xs"
              >
                Book a Space Now
              </Link>
              <Link
                href="/register?role=owner"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-[13px] font-semibold transition-colors"
              >
                View Corporate Plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}