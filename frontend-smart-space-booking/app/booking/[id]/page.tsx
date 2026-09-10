"use client";

import React, { useEffect, useState, use, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getSpaceDetail,
  getBookedSlots,
  createReservation,
  checkDiscount,
  Space,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/components/SpaceCard";
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Tag,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const STANDARD_HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

export default function BookingPage({ params }: BookingPageProps) {
  const resolvedParams = use(params);
  const spaceId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [space, setSpace] = useState<Space | null>(null);
  const [loadingSpace, setLoadingSpace] = useState(true);
  const [spaceError, setSpaceError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const initialDateParam = searchParams.get("tanggal");
  const initialStartParam = searchParams.get("jamMulai");
  const initialDurasiParam = searchParams.get("durasi");

  const [viewYear, setViewYear] = useState(() => {
    if (initialDateParam) {
      const d = new Date(initialDateParam);
      if (!isNaN(d.getTime())) return d.getFullYear();
    }
    return today.getFullYear();
  });

  const [viewMonth, setViewMonth] = useState(() => {
    if (initialDateParam) {
      const d = new Date(initialDateParam);
      if (!isNaN(d.getTime())) return d.getMonth();
    }
    return today.getMonth();
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialDateParam) {
      const d = new Date(initialDateParam);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
    }
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });

  const [selectedHours, setSelectedHours] = useState<string[]>(() => {
    if (initialStartParam && initialDurasiParam) {
      const start = initialStartParam;
      const count = parseInt(initialDurasiParam, 10) || 1;
      const idx = STANDARD_HOURS.indexOf(start);
      if (idx !== -1) {
        return STANDARD_HOURS.slice(idx, idx + count);
      }
    }
    return ["09:00", "10:00"];
  });

  const [bookedSlotList, setBookedSlotList] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    percent: number;
    discountId?: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.member?.namaMember) setFullName(user.member.namaMember);
      else if (user.spaceOwner?.namaPemilik) setFullName(user.spaceOwner.namaPemilik);
      if (user.email) setEmail(user.email);
      if (user.member?.telp) setPhone(user.member.telp);
      else if (user.spaceOwner?.telp) setPhone(user.spaceOwner.telp);
    }
  }, [user]);

  useEffect(() => {
    async function loadSpace() {
      if (!spaceId || isNaN(spaceId)) {
        setSpaceError("ID Ruangan tidak valid.");
        setLoadingSpace(false);
        return;
      }

      setLoadingSpace(true);
      setSpaceError(null);
      try {
        const data = await getSpaceDetail(spaceId);
        setSpace(data);
      } catch (err) {
        setSpaceError(getApiErrorMessage(err) || "Ruangan tidak ditemukan.");
      } finally {
        setLoadingSpace(false);
      }
    }
    loadSpace();
  }, [spaceId]);

  const loadSlots = useCallback(async () => {
    if (!spaceId || isNaN(spaceId) || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const data = await getBookedSlots(spaceId, selectedDate);
      const booked = Array.isArray(data) ? data.map((s) => s.jamMulai) : [];
      setBookedSlotList(booked);
    } catch {
      setBookedSlotList([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [spaceId, selectedDate]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(formatted);
  };

  const toggleHour = (hour: string) => {
    if (bookedSlotList.includes(hour)) return;

    if (selectedHours.includes(hour)) {
      if (selectedHours.length === 1) return;
      setSelectedHours((prev) => prev.filter((h) => h !== hour));
    } else {
      const sorted = [...selectedHours, hour].sort(
        (a, b) => STANDARD_HOURS.indexOf(a) - STANDARD_HOURS.indexOf(b)
      );
      setSelectedHours(sorted);
    }
  };

  const durationHours = selectedHours.length || 1;
  const startHour = selectedHours[0] || "09:00";
  const spaceRental = (space?.hargaPerJam || 0) * durationHours;

  const discountAmount = appliedPromo
    ? Math.round((spaceRental * appliedPromo.percent) / 100)
    : 0;

  const totalPayable = Math.max(0, spaceRental - discountAmount);

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setPromoLoading(true);
    setPromoMessage(null);

    try {
      const res = await checkDiscount(promoInput.trim().toUpperCase(), spaceId);
      if (res.isValid) {
        const discObj = res.diskon || res.data;
        const pct = discObj?.persentaseDiskon || 10;
        setAppliedPromo({
          code: discObj?.kodeDiskon || promoInput.toUpperCase(),
          percent: pct,
          discountId: discObj?.id,
        });
        setPromoMessage({
          text: `Kode "${discObj?.kodeDiskon || promoInput}" aktif! Hemat ${pct}%.`,
          type: "success",
        });
      } else {
        setAppliedPromo(null);
        setPromoMessage({
          text: res.message || "Kode promo tidak valid atau telah kadaluarsa.",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setAppliedPromo(null);
      setPromoMessage({
        text: getApiErrorMessage(err) || "Gagal memeriksa kode promo.",
        type: "error",
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleProceedCheckout = async () => {
    if (!isAuthenticated) {
      const returnUrl = `/booking/${spaceId}?tanggal=${selectedDate}&jamMulai=${startHour}&durasi=${durationHours}`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setSubmitError("Lengkapi nama, email, dan nomor telepon pemesan.");
      return;
    }

    if (selectedHours.length === 0) {
      setSubmitError("Pilih minimal satu slot jam pemakaian.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await createReservation({
        spaceId,
        tanggalReservasi: selectedDate,
        jamMulai: startHour,
        durasiJam: durationHours,
        kodeDiskon: appliedPromo?.code,
      });

      const resId = res.data?.id || (res as any).id || (res as any).reservasiId;
      if (resId) {
        router.push(`/checkout/${resId}`);
      } else {
        router.push("/dashboard/member/transactions");
      }
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err) || "Gagal memproses reservasi.");
      setSubmitting(false);
    }
  };

  if (loadingSpace) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-[#006370] animate-spin mb-2" />
        <p className="text-xs font-medium text-slate-600">Memuat formulir pemesanan...</p>
      </div>
    );
  }

  if (spaceError || !space) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-slate-900">Ruangan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{spaceError || "Ruangan tidak tersedia atau telah dihapus."}</p>
          <div className="pt-2">
            <Link
              href="/spaces"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Katalog Ruangan</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fallbackImage =
    space.tipe === "meeting_room"
      ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
      : space.tipe === "private_office"
      ? "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80"
      : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
              <span>RESERVASI RUANGAN</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-sans font-normal">
                {space.owner?.namaCoworking || "WorkNest Hub"}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Pesan Ruang Kerja
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Pilih tanggal, tentukan durasi jam sewa, dan konfirmasikan pemesanan ruangan Anda.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              href={`/spaces/${space.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Detail Ruangan</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xs border border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-44 h-28 rounded-xs overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
              <img
                src={space.foto || fallbackImage}
                alt={space.namaSpace}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
              <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white font-mono text-[10px] px-2 py-0.5 rounded-xs font-bold uppercase">
                {space.tipe?.replace(/_/g, " ")}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-xl font-bold text-slate-900">
                  {space.namaSpace}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Siap Dipesan</span>
                </span>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{space.owner?.alamat || space.owner?.namaCoworking || "WorkNest Hub"}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600 pt-0.5">
                <span className="bg-slate-100 px-2 py-0.5 rounded-xs font-mono font-medium border border-slate-200">
                  👥 {space.kapasitas} Orang
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-xs font-mono font-medium border border-slate-200">
                  📶 Wi-Fi Fiber
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-xs font-mono font-medium border border-slate-200">
                  🔑 Kunci Digital QR
                </span>
              </div>
            </div>
          </div>

          <div className="text-right self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
            <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">Tarif Sewa</span>
            <div className="text-xl font-bold text-[#006370] font-mono">
              {formatRupiah(space.hargaPerJam)} <span className="text-xs font-normal text-slate-500 font-sans">/ jam</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xs border border-slate-200 p-6 space-y-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-xs bg-[#006370] text-white flex items-center justify-center text-xs font-bold font-mono">
                    1
                  </span>
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    Pilih Tanggal &amp; Jam Pemakaian
                  </h3>
                </div>
                <span className="text-xs font-semibold text-[#006370] font-mono">
                  WIB (GMT+7)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-slate-50 p-4 rounded-xs border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 hover:text-slate-700 cursor-pointer rounded-xs"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 hover:text-slate-700 cursor-pointer rounded-xs"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                    {DAY_NAMES.map((d) => (
                      <span key={d} className="font-semibold text-slate-400 py-1 font-mono">
                        {d}
                      </span>
                    ))}

                    {Array.from({ length: firstDayOfWeek }, (_, i) => (
                      <span key={`blank-${i}`} className="py-1.5" />
                    ))}

                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const thisDate = new Date(viewYear, viewMonth, day);
                      const isPast =
                        thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const isSelected =
                        selectedDate ===
                        `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isPast}
                          onClick={() => handleSelectDay(day)}
                          className={`py-1.5 rounded-xs font-semibold transition-all cursor-pointer text-xs ${
                            isSelected
                              ? "bg-[#006370] text-white font-bold shadow-xs"
                              : isPast
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-xs bg-[#006370]" /> Terpilih
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-xs bg-slate-300" /> Terisi
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-xs bg-slate-200 border" /> Tersedia
                    </span>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Slot Jam: {formattedSelectedDate}
                    </span>
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#E6F4F2] text-[#006370] border border-[#BCE3DE]">
                      {durationHours} Jam Dipilih
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Klik pada slot jam yang ingin Anda pesan. Anda dapat memilih beberapa jam berturut-turut.
                  </p>

                  {loadingSlots ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#006370] mb-1" />
                      <span>Memeriksa ketersediaan jam...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {STANDARD_HOURS.map((hour) => {
                        const isBooked = bookedSlotList.includes(hour);
                        const isSelected = selectedHours.includes(hour);
                        const endHourNum = parseInt(hour.split(":")[0], 10) + 1;
                        const label = `${hour} - ${String(endHourNum).padStart(2, "0")}:00`;

                        return (
                          <button
                            key={hour}
                            type="button"
                            disabled={isBooked}
                            onClick={() => toggleHour(hour)}
                            className={`py-2 px-2.5 rounded-xs text-xs font-semibold transition-all flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? "bg-[#006370] text-white font-bold shadow-2xs"
                                : isBooked
                                ? "bg-slate-50 text-slate-300 line-through border border-dashed border-slate-200 cursor-not-allowed"
                                : "bg-white text-slate-700 border border-slate-200 hover:border-[#006370] hover:bg-slate-50"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-3 p-3 rounded-xs bg-[#E6F4F2]/50 border border-[#BCE3DE] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <Clock className="w-4 h-4 text-[#006370]" />
                      <span>
                        Durasi: {selectedHours[0] || "09:00"} &mdash;{" "}
                        {selectedHours[selectedHours.length - 1]
                          ? `${String(parseInt(selectedHours[selectedHours.length - 1].split(":")[0], 10) + 1).padStart(2, "0")}:00`
                          : "10:00"}{" "}
                        ({durationHours} Jam)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xs border border-slate-200 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-5 h-5 rounded-xs bg-[#006370] text-white flex items-center justify-center text-xs font-bold font-mono">
                  2
                </span>
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    Informasi Kontak Pemesan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tiket digital dan kode akses QR akan dikirimkan ke kontak ini.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700">
                    Nama Lengkap Pemesan *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-slate-900 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Email Kontak *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-slate-900 focus:outline-none transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Nomor WhatsApp / HP *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-slate-900 focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            <div className="bg-white rounded-xs border border-slate-200 p-5 space-y-4 shadow-2xs">
              <h3 className="font-serif text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Ringkasan Pemesanan
              </h3>

              <div className="space-y-2 border-b border-slate-100 pb-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-800">Ruangan</span>
                  <span className="font-semibold text-slate-900">{space.namaSpace}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal</span>
                  <span className="font-medium text-slate-900">{formattedSelectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Durasi</span>
                  <span className="font-medium text-slate-900">{durationHours} Jam</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>
                    Sewa ({formatRupiah(space.hargaPerJam)} &times; {durationHours} jam)
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatRupiah(spaceRental)}
                  </span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{appliedPromo.code} (-{appliedPromo.percent}%)</span>
                    </span>
                    <span className="font-mono">-{formatRupiah(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Total Bayar</span>
                  <span className="text-lg font-bold text-[#006370] font-mono">
                    {formatRupiah(totalPayable)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleApplyPromo} className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-700">
                  Punya Kode Voucher?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="KODE PROMO"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#006370] rounded-xs text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-3 py-1.5 rounded-xs bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Gunakan"}
                  </button>
                </div>

                {promoMessage && (
                  <p
                    className={`text-[11px] font-medium ${
                      promoMessage.type === "success" ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {promoMessage.text}
                  </p>
                )}
              </form>

              {submitError && (
                <div className="p-3 rounded-xs bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedCheckout}
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xs bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Reservasi...</span>
                  </>
                ) : (
                  <>
                    <span>Lanjut ke Pembayaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
