"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getSpaceDetail,
  getSpaces,
  createReservation,
  checkDiscount,
  startPayment,
  syncPayment,
  Space,
  Discount,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/components/SpaceCard";
import { QrCodeCard } from "@/components/QrCodeCard";
import { snapPay } from "@/lib/midtrans-snap";
import {
  Calendar,
  Tag,
  Users,
  Building2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Percent,
  Wallet,
  Sparkles,
} from "lucide-react";

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingPage({ params }: BookingPageProps) {
  const resolvedParams = use(params);
  const spaceId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [space, setSpace] = useState<Space | null>(null);
  const [loadingSpace, setLoadingSpace] = useState(true);
  const [spaceError, setSpaceError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const [tanggalReservasi, setTanggalReservasi] = useState(todayStr);
  const [jamMulai, setJamMulai] = useState("09:00");
  const [durasiJam, setDurasiJam] = useState(2);

  const SERVICE_START = 8;
  const SERVICE_END = 20;
  const TIME_SLOTS: string[] = [];
  for (let h = SERVICE_START; h <= SERVICE_END; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
    if (h < SERVICE_END) {
      TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
    }
  }

  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [promoMessage, setPromoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);

  const [payingDirect, setPayingDirect] = useState(false);
  const [directPaySuccess, setDirectPaySuccess] = useState(false);
  const [directPayError, setDirectPayError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpace() {
      setLoadingSpace(true);
      setSpaceError(null);
      try {
        const data = await getSpaceDetail(spaceId);
        setSpace(data);
      } catch (err: unknown) {
        setSpaceError(getApiErrorMessage(err));
      } finally {
        setLoadingSpace(false);
      }
    }
    if (spaceId) {
      loadSpace();
    }
  }, [spaceId]);

  useEffect(() => {
    if (!tanggalReservasi) return;
    let cancelled = false;
    setCheckingAvailability(true);
    setAvailability({});

    async function checkAvailability() {
      const result: Record<string, boolean> = {};
      try {
        const probes = await Promise.all(
          TIME_SLOTS.map((slot) => {
            return getSpaces({
              tanggal: tanggalReservasi,
              jamMulai: slot,
              durasiJam: 1,
            }).then(
              (list) => {
                const available =
                  Array.isArray(list) && list.some((s) => s.id === spaceId);
                return [slot, available] as const;
              },
              () => [slot, false] as const,
            );
          }),
        );
        for (const [slot, available] of probes) {
          result[slot] = available;
        }
      } catch {
      } finally {
        if (!cancelled) {
          setAvailability(result);
          setCheckingAvailability(false);
        }
      }
    }

    checkAvailability();
    return () => {
      cancelled = true;
    };
  }, [tanggalReservasi, spaceId]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setCheckingPromo(true);
    setPromoMessage(null);
    try {
      const res = await checkDiscount(promoInput.trim());
      const validDiscount = res.data || res.diskon;
      if (res.isValid && validDiscount) {
        setAppliedDiscount(validDiscount);
        setPromoMessage({
          type: "success",
          text: `Kupon "${validDiscount.kodeDiskon || validDiscount.namaDiskon}" berhasil diterapkan (${validDiscount.persentaseDiskon}% OFF)`,
        });
      } else {
        setAppliedDiscount(null);
        setPromoMessage({
          type: "error",
          text: res.message || "Kode promo tidak valid atau telah kedaluwarsa.",
        });
      }
    } catch (err: unknown) {
      setAppliedDiscount(null);
      setPromoMessage({
        type: "error",
        text: getApiErrorMessage(err),
      });
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
    setPromoInput("");
    setPromoMessage(null);
  };

  const isTodayIso = (d: string) => d === todayStr;
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const slotCanFit = (slot: string) => {
    const startMins = timeToMinutes(slot);
    return startMins + durasiJam * 60 <= SERVICE_END * 60;
  };

  const slotIsPast = (slot: string) => {
    return isTodayIso(tanggalReservasi) && timeToMinutes(slot) <= nowMinutes;
  };

  const toggleSlot = (start: string) => {
    setJamMulai((prev) => (prev === start ? "" : start));
  };

  const handleDirectPay = async () => {
    if (!bookingSuccessData) return;
    setPayingDirect(true);
    setDirectPayError(null);
    try {
      const response = await startPayment(bookingSuccessData.id);
      const result = response.data;
      await snapPay(result.clientKey, result.snapScriptUrl, result.snapToken, {
        onSuccess: async () => {
          try {
            await syncPayment(result.transactionId);
          } catch {}
          setDirectPaySuccess(true);
          setPayingDirect(false);
        },
        onPending: async () => {
          try {
            await syncPayment(result.transactionId);
          } catch {}
          setDirectPaySuccess(true);
          setPayingDirect(false);
        },
        onError: () => {
          setDirectPayError("Pembayaran gagal atau dibatalkan oleh gateway.");
          setPayingDirect(false);
        },
        onClose: () => {
          setPayingDirect(false);
        },
      });
    } catch (err: unknown) {
      setDirectPayError(getApiErrorMessage(err));
      setPayingDirect(false);
    }
  };

  const hourlyRate = space?.hargaPerJam || 0;
  const subtotal = hourlyRate * durasiJam;
  const discountPercent = appliedDiscount ? appliedDiscount.persentaseDiskon : 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!isAuthenticated) {
      router.push(`/login?redirect=/booking/${spaceId}`);
      return;
    }

    if (!tanggalReservasi) {
      setSubmitError("Pilih tanggal reservasi terlebih dahulu.");
      return;
    }
    if (!jamMulai) {
      setSubmitError("Pilih jam mulai reservasi pada slot waktu yang tersedia.");
      return;
    }
    if (!durasiJam || Number(durasiJam) < 1) {
      setSubmitError("Durasi sewa minimal 1 jam.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        spaceId: Number(spaceId),
        tanggalReservasi: tanggalReservasi,
        jamMulai: jamMulai,
        durasiJam: Number(durasiJam),
      };

      if (appliedDiscount?.id) {
        payload.diskonId = Number(appliedDiscount.id);
      }
      if (appliedDiscount?.kodeDiskon) {
        payload.kodeDiskon = String(appliedDiscount.kodeDiskon).toUpperCase();
      }

      const res = await createReservation(payload);
      const reservationData = (res as any)?.data || res;
      setBookingSuccessData(reservationData);
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(err);
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSpace) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
          <p className="text-xs font-semibold">Memuat rincian ruangan...</p>
        </div>
      </div>
    );
  }

  if (spaceError || !space) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Ruangan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">{spaceError || "Ruangan ini tidak tersedia atau telah dihapus."}</p>
        <Link
          href="/spaces"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </Link>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href={`/spaces/${space.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Rincian Ruangan</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="relative aspect-[16/10] bg-slate-100 border-b border-slate-200">
              <img
                src={space.foto || fallbackImage}
                alt={space.namaSpace}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/95 backdrop-blur-xs text-sky-800 border border-sky-200">
                  {space.tipe === "desk"
                    ? "Hot Desk"
                    : space.tipe === "meeting_room"
                    ? "Meeting Room"
                    : "Private Office"}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div>
                {space.owner?.namaCoworking && (
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{space.owner.namaCoworking}</span>
                  </p>
                )}
                <h1 className="text-xl font-bold text-slate-900">{space.namaSpace}</h1>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Kapasitas</p>
                  <p className="font-semibold text-slate-800">{space.kapasitas} Orang</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Tarif Dasar</p>
                  <p className="font-semibold text-slate-800 font-mono">
                    {formatRupiah(space.hargaPerJam)}/jam
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-900">Validasi Check-In Otomatis</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tiket QR mandiri akan diterbitkan otomatis setelah formulir pemesanan dikonfirmasi.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Konfigurasi Jadwal & Durasi
              </h2>
              <p className="text-xs text-slate-500">
                Tentukan tanggal, jam mulai, serta durasi jam pemakaian ruangan.
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-2.5 text-rose-800 text-xs shadow-xs animate-shake">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-rose-900">Reservasi Belum Dapat Diproses</p>
                    <p className="font-medium leading-relaxed">{submitError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-rose-500 hover:text-rose-800 font-bold text-sm cursor-pointer p-0.5"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleCreateReservation} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tanggal Pemakaian
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={tanggalReservasi}
                      onChange={(e) => setTanggalReservasi(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Jam Mulai (WIB)
                    </label>
                    {checkingAvailability && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-sky-600 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Cek ketersediaan...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    {TIME_SLOTS.map((slot) => {
                      const confirmedTaken = checkingAvailability
                        ? false
                        : availability[slot] === false;
                      const unknown =
                        checkingAvailability || availability[slot] === undefined;
                      const cannotFit = !slotCanFit(slot);
                      const isPast = slotIsPast(slot);
                      const disabled = confirmedTaken || cannotFit || isPast;
                      const selected = jamMulai === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={disabled}
                          onClick={() => toggleSlot(slot)}
                          aria-pressed={selected}
                          title={
                            confirmedTaken
                              ? "Slot ini telah dibooking member lain"
                              : cannotFit
                              ? "Durasi melebihi jam operasional (20:00)"
                              : `Pilih pukul ${slot} WIB`
                          }
                          className={`relative py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                            cannotFit
                              ? "opacity-35 bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                              : isPast
                              ? "opacity-35 bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                              : selected
                              ? "bg-sky-600 text-white border-sky-600 shadow-xs font-bold"
                              : confirmedTaken
                              ? "bg-rose-50 text-rose-400 border-rose-100 cursor-not-allowed"
                              : unknown
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : "bg-white text-slate-800 border-slate-300 hover:border-sky-500 hover:text-sky-700"
                          }`}
                        >
                          {slot}
                          {confirmedTaken && (
                            <span className="block text-[9px] font-normal text-rose-500">
                              Penuh
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-sky-600 inline-block" /> Terpilih
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Terisi
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block" /> Tersedia
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-slate-100 inline-block" /> Melewati operasional
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">
                    Durasi Pemakaian: <span className="text-sky-600 font-bold">{durasiJam} Jam</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Min. 1 jam - Maks. 8 jam</span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 6, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDurasiJam(h)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        durasiJam === h
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {h} Jam
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Kode Promo Diskon (Opsional)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      disabled={!!appliedDiscount || checkingPromo}
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode promo"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 focus:border-sky-600 rounded-lg text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  {appliedDiscount ? (
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                    >
                      Hapus
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={checkingPromo || !promoInput.trim()}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {checkingPromo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Percent className="w-3.5 h-3.5" />
                      )}
                      <span>Terapkan</span>
                    </button>
                  )}
                </div>

                {promoMessage && (
                  <p
                    className={`text-xs font-medium flex items-center gap-1 mt-1 ${
                      promoMessage.type === "success" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {promoMessage.type === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{promoMessage.text}</span>
                  </p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">
                  Rincian Biaya Pemakaian
                </p>

                <div className="flex justify-between text-slate-600">
                  <span>
                    Tarif Dasar ({durasiJam} jam × {formatRupiah(hourlyRate)})
                  </span>
                  <span className="font-mono font-medium text-slate-900">{formatRupiah(subtotal)}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Diskon Kupon ({appliedDiscount.persentaseDiskon}%)</span>
                    <span className="font-mono">- {formatRupiah(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Total Pembayaran</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">
                    {formatRupiah(finalTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses Reservasi...</span>
                  </>
                ) : (
                  <>
                    <span>Ajukan Reservasi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {bookingSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 text-center border border-slate-200 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            {bookingSuccessData.status === "disetujui" ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant Booking — Langsung Disetujui!</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Pemesanan Disetujui Otomatis
                </h3>
                <p className="text-xs text-slate-500">
                  Reservasi <span className="font-bold text-slate-700">#{bookingSuccessData.id}</span> telah disetujui. Selesaikan pembayaran sekarang untuk mengaktifkan kode QR check-in Anda.
                </p>

                {directPayError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
                    {directPayError}
                  </div>
                )}

                {directPaySuccess ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pembayaran Berhasil! Tiket QR Anda sekarang aktif dan siap dipakai.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleDirectPay}
                    disabled={payingDirect}
                    className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {payingDirect ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membuka Snap Payment...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        <span>Bayar Sekarang (Midtrans Snap)</span>
                      </>
                    )}
                  </button>
                )}

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
                  <QrCodeCard
                    value={bookingSuccessData.qrCode}
                    size={118}
                    label="E-Tiket Siap Pakai"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Pemesanan Terkirim & Menunggu Persetujuan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nomor reservasi{" "}
                    <span className="font-bold text-slate-700">
                      #{bookingSuccessData.id}
                    </span>{" "}
                    telah tercatat. Pemilik ruangan akan memverifikasi permintaan Anda.
                  </p>
                </div>

                <div className="w-full space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center">
                      1
                    </div>
                    <span className="text-xs font-semibold text-slate-900">
                      Menunggu Persetujuan
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                      2
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      Tiket QR Aktif
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                      3
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      Check-In di Lokasi
                    </span>
                  </div>
                </div>

                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Kode QR Anda baru aktif dan dapat digunakan untuk check-in{" "}
                    <span className="font-semibold">setelah pemesanan disetujui</span>{" "}
                    oleh pemilik ruangan.
                  </span>
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
                  <QrCodeCard
                    value={bookingSuccessData.qrCode}
                    size={118}
                    label="Tiket Terbit — Menunggu Persetujuan"
                  />
                  <p className="text-[11px] text-slate-500 pt-1">
                    Pantau status di "Tiket Saya". Anda dapat menunjukkan kode QR ini
                    setelah status disetujui.
                  </p>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/member")}
                className="py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Lihat Tiket Saya
              </button>
              <button
                type="button"
                onClick={() => router.push("/spaces")}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Katalog Ruangan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
