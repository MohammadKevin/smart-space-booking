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
              Spaces
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
              <span>Verified Hub</span>
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
                  ({reviews.length > 0 ? `${reviews.length} verified reviews` : "84 verified reviews"})
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
              <span>Share</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save</span>
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
                {space.tipe === "meeting_room" ? "Executive Main Suite" : "Dedicated Workstation Area"}
              </span>
            </div>
          </div>

          {/* Sub Photos 2x2 Grid */}
          <div className="md:col-span-4 grid grid-cols-2 gap-3">
            {galleryThumbs.map((thumb, idx) => (
              <div key={idx} className="relative aspect-[4/3] bg-slate-100 overflow-hidden rounded-xl">
                <img src={thumb} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === 3 && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold">
                    Show all photos
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
                  Executive Space Specifications
                </h3>
                <span className="text-[11px] font-mono text-slate-400">AREA: 48 SQM</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs">
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Capacity</span>
                  </span>
                  <p className="font-semibold text-slate-900">{space.kapasitas} Executive Pax</p>
                  <p className="text-[11px] text-slate-500">Ergonomic swivel seats</p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <Tv className="w-3.5 h-3.5 text-slate-400" />
                    <span>Display</span>
                  </span>
                  <p className="font-semibold text-slate-900">85" Sony Bravia 4K</p>
                  <p className="text-[11px] text-slate-500">HDMI 2.1 / AirPlay / USB-C</p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <Radio className="w-3.5 h-3.5 text-slate-400" />
                    <span>AV System</span>
                  </span>
                  <p className="font-semibold text-slate-900">Polycom Studio X50</p>
                  <p className="text-[11px] text-slate-500">Auto-framing beamforming</p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <Wifi className="w-3.5 h-3.5 text-slate-400" />
                    <span>Network</span>
                  </span>
                  <p className="font-semibold text-slate-900">1.2 Gbps Symmetrical</p>
                  <p className="text-[11px] text-slate-500">Direct fiber line redundancy</p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>Acoustics</span>
                  </span>
                  <p className="font-semibold text-slate-900">-42 dB Isolation</p>
                  <p className="text-[11px] text-slate-500">Dual-glazed acoustic glass</p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                    <Coffee className="w-3.5 h-3.5 text-slate-400" />
                    <span>Beverages</span>
                  </span>
                  <p className="font-semibold text-slate-900">Unlimited Nespresso</p>
                  <p className="text-[11px] text-slate-500">Chilled & hot mineral bar</p>
                </div>
              </div>
            </div>

            {/* About the Space */}
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-slate-900">About {space.namaSpace}</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {space.deskripsi ||
                  "Architected specifically for high-stakes investor pitches, hybrid cross-border planning sessions, and executive board meetings. Provides guaranteed sound transmission class rating reduction with complete confidentiality maintained."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ultra-wide 3m magnetic glass whiteboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Individual Daikin climate control inverter</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Wireless Barco ClickShare screen dongles</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Executive stationery pack & refill pads</span>
                </div>
              </div>
            </div>

            {/* House Rules & Seamless Access */}
            <div className="space-y-3 pt-2">
              <h3 className="font-serif text-lg font-bold text-slate-900">House Rules & Seamless Access</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Auto QR Turnstile Pass</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Encrypted visitor key generated and dispatched exactly 15 minutes before your booked window for turnstile access.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Zero-Config Wi-Fi</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    WPA3 Enterprise credentials seamlessly handshake with your smartphone upon clearing the turnstile threshold.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Clean Air Protocol</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Strict 100% smoke-free environment. Dedicated outdoor garden lounge situated on floor 2 for breaks.
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Arrival */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-slate-900">Location & Arrival</h3>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-cyan-700 hover:text-cyan-900 inline-flex items-center gap-1"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-500">{locationText}</p>
              <div className="w-full h-44 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                <div className="text-center space-y-1">
                  <MapPin className="w-6 h-6 mx-auto text-cyan-700" />
                  <p className="font-semibold text-slate-800">{coworkingName}</p>
                  <p className="text-[11px] text-slate-400">Basement B1 & B2 Valet / Self-parking available</p>
                </div>
              </div>
            </div>

            {/* Verified Member Reviews */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">Verified Member Reviews</h3>
                  <p className="text-xs text-slate-500">From team leads and executives who hosted in this room</p>
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
                        <p className="text-[10px] text-slate-400">Chief Technology Officer, Antara Labs • Oct 18, 2024</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Verified Booker
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Hosted our quarterly engineering OKR session here with remote participants dialing in from Singapore and Tokyo. The Polycom Studio auto-speaker tracking was flawless, and the acoustic isolation made everyone feel in the exact same room.
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
                        <p className="text-[10px] text-slate-400">Managing Director, Bromo Ventures • Oct 02, 2024</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Verified Booker
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    The QR key delivered directly via WhatsApp made onboarding frictionless for 10 guest investors. The concierge at Malang Hub had warm espresso ready as requested.
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
                  <span className="text-xs text-slate-500 font-normal"> / hour</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Available Today</span>
                </span>
              </div>

              {/* Date Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>DATE</span>
                  <label htmlFor="date-input" className="text-cyan-700 hover:text-cyan-900 cursor-pointer">
                    CHANGE DATE
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
                  <span>SELECT DURATION</span>
                  <span className="text-cyan-800 font-bold">{durationHours} Hours Selected</span>
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
                  Continuous booking: {selectedHours[0] || "09:00"} —{" "}
                  {selectedHours[selectedHours.length - 1] || "17:00"} ({durationHours} hours)
                </p>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>
                    {durationHours} Hours × {formatRupiah(space.hargaPerJam)}
                  </span>
                  <span className="font-mono text-slate-900">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Facility & Sanitation Fee</span>
                  <span className="font-mono text-slate-900">{formatRupiah(facilityFee)}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Total Investment</span>
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
                <span>Continue to Booking</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Security note */}
              <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                Encrypted QR Pass sent instantly via WhatsApp & email after confirmation. No keycard pickup needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
