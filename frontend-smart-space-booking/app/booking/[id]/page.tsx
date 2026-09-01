"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getSpaceDetail,
  createReservation,
  checkDiscount,
  Space,
  Discount,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/components/SpaceCard";
import {
  Calendar,
  Clock,
  Tag,
  Users,
  Building,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Sparkles,
  Percent,
} from "lucide-react";

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingPage({ params }: BookingPageProps) {
  const resolvedParams = use(params);
  const spaceId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [space, setSpace] = useState<Space | null>(null);
  const [loadingSpace, setLoadingSpace] = useState(true);
  const [spaceError, setSpaceError] = useState<string | null>(null);

  // Booking Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [tanggalReservasi, setTanggalReservasi] = useState(todayStr);
  const [jamMulai, setJamMulai] = useState("09:00");
  const [durasiJam, setDurasiJam] = useState(2);

  // Promo / Discount State
  const [promoInput, setPromoInput] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [promoMessage, setPromoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);

  // Load Space Data
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

  // Handle Promo Verification
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setCheckingPromo(true);
    setPromoMessage(null);
    try {
      const res = await checkDiscount(promoInput.trim());
      if (res.valid && res.data) {
        setAppliedDiscount(res.data);
        setPromoMessage({
          type: "success",
          text: `Kupon "${res.data.kodeDiskon}" berhasil diterapkan (${res.data.persentaseDiskon}% OFF)!`,
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

  // Price Calculations
  const hourlyRate = space?.hargaPerJam || 0;
  const subtotal = hourlyRate * durasiJam;
  const discountPercent = appliedDiscount ? appliedDiscount.persentaseDiskon : 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Handle Submit
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!isAuthenticated) {
      router.push(`/login?redirect=/booking/${spaceId}`);
      return;
    }

    if (!tanggalReservasi) {
      setSubmitError("Silakan pilih tanggal reservasi");
      return;
    }
    if (!jamMulai) {
      setSubmitError("Silakan pilih jam mulai");
      return;
    }
    if (durasiJam < 1) {
      setSubmitError("Durasi pemakaian minimal 1 jam");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        spaceId: spaceId,
        tanggalReservasi: tanggalReservasi,
        jamMulai: jamMulai,
        durasiJam: Number(durasiJam),
      };

      if (appliedDiscount) {
        payload.diskonId = appliedDiscount.id;
        payload.kodeDiskon = appliedDiscount.kodeDiskon;
      }

      const res = await createReservation(payload);
      setBookingSuccessData(res.data);
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSpace) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-xs font-semibold">Memuat rincian ruangan...</p>
        </div>
      </div>
    );
  }

  if (spaceError || !space) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Ruangan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">{spaceError || "Ruangan ini tidak tersedia atau telah dihapus."}</p>
        <Link
          href="/spaces"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-xl hover:bg-sky-700 transition-colors"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Navigation Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/spaces/${space.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Rincian Ruangan</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Space Summary Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="relative aspect-[16/10] bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={space.foto || fallbackImage}
                alt={space.namaSpace}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-sky-700 border border-sky-200">
                  {space.tipe === "desk"
                    ? "Hot Desk"
                    : space.tipe === "meeting_room"
                    ? "Meeting Room"
                    : "Private Office"}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                {space.owner?.namaCoworking && (
                  <p className="text-xs font-bold text-sky-600 flex items-center gap-1 mb-1">
                    <Building className="w-3.5 h-3.5" />
                    <span>{space.owner.namaCoworking}</span>
                  </p>
                )}
                <h1 className="text-2xl font-black text-slate-900">
                  {space.namaSpace}
                </h1>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {space.deskripsi || "Ruangan representatif dengan fasilitas lengkap dan kenyamanan maksimal."}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  <div>
                    <p className="text-slate-400 font-bold text-[10px] uppercase">Kapasitas</p>
                    <p className="font-bold text-slate-800">{space.kapasitas} Orang</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <div>
                    <p className="text-slate-400 font-bold text-[10px] uppercase">Tarif</p>
                    <p className="font-bold text-slate-800">{formatRupiah(space.hargaPerJam)}/jam</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-3xl flex items-start gap-3 text-xs text-sky-900">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Konfirmasi & Check-In Mandiri Instan</p>
              <p className="text-sky-700 leading-relaxed text-[11px]">
                Setelah pemesanan dikonfirmasi, Anda akan memperoleh kode QR tiket untuk proses check-in cepat di lokasi.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Booking Form & Calculator */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">
                Konfigurasi Jadwal & Durasi
              </h2>
              <p className="text-xs text-slate-500">
                Pilih tanggal, jam mulai, dan durasi sewa yang Anda butuhkan.
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="leading-snug font-medium">{submitError}</div>
              </div>
            )}

            <form onSubmit={handleCreateReservation} className="space-y-6">
              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tanggal Reservasi */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tanggal Pemakaian
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={tanggalReservasi}
                      onChange={(e) => setTanggalReservasi(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                    />
                  </div>
                </div>

                {/* Jam Mulai */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Jam Mulai (WIB)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <select
                      value={jamMulai}
                      onChange={(e) => setJamMulai(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 cursor-pointer"
                    >
                      {[
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
                      ].map((time) => (
                        <option key={time} value={time}>
                          Pukul {time} WIB
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Durasi Jam */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Durasi Sewa: <span className="text-sky-600">{durasiJam} Jam</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Min. 1 Jam - Max. 12 Jam</span>
                </div>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 6, 8].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDurasiJam(hours)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        durasiJam === hours
                          ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {hours} Jam
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kode Promo / Kupon Diskon (Opsional)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      disabled={!!appliedDiscount || checkingPromo}
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode kupon"
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 uppercase border border-slate-200 focus:border-sky-500 rounded-xl text-sm font-semibold tracking-wider text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60"
                    />
                  </div>

                  {appliedDiscount ? (
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                    >
                      Hapus
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={checkingPromo || !promoInput.trim()}
                      className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
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
                      promoMessage.type === "success" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {promoMessage.type === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {promoMessage.text}
                  </p>
                )}
              </div>

              {/* Dynamic Live Price Breakdown */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Rincian Biaya Real-Time
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Tarif Dasar ({durasiJam} jam × {formatRupiah(hourlyRate)})
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>

                  {appliedDiscount && (
                    <div className="flex justify-between text-emerald-600 font-semibold animate-in fade-in">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        Diskon Kupon ({appliedDiscount.persentaseDiskon}%)
                      </span>
                      <span>- {formatRupiah(discountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-sm">
                      Total Tagihan
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-sky-600">
                        {formatRupiah(finalTotal)}
                      </span>
                      <p className="text-[10px] text-slate-400">Termasuk fasilitas lengkap</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-xs text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Pemesanan...</span>
                  </>
                ) : (
                  <>
                    <span>Konfirmasi & Terbitkan Tiket Reservasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal / QR Receipt Confirmation */}
      {bookingSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">
                Reservasi Berhasil Dibuat!
              </h3>
              <p className="text-xs text-slate-500">
                Tiket pemesanan Anda telah diterbitkan di sistem live.
              </p>
            </div>

            {/* QR Code display */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-sky-700">
                <QrCode className="w-4 h-4" />
                <span>Kode Tiket QR</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 inline-block shadow-sm">
                <p className="font-mono text-sm font-black text-slate-900 tracking-wider">
                  {bookingSuccessData.qrCode}
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                Tunjukkan kode ini kepada staff operasional saat check-in di lokasi.
              </p>
            </div>

            {/* Receipt snippet */}
            <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Ruangan:</span>
                <span className="font-bold text-slate-800">{space.namaSpace}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jadwal:</span>
                <span className="font-bold text-slate-800">
                  {bookingSuccessData.tanggalReservasi?.split("T")[0] || tanggalReservasi} ({bookingSuccessData.jamMulai})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Biaya:</span>
                <span className="font-black text-sky-600">
                  {formatRupiah(bookingSuccessData.detailReservasi?.totalHarga || finalTotal)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/member")}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Dashboard Member
              </button>
              <button
                type="button"
                onClick={() => router.push("/spaces")}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Katalog Lainnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
