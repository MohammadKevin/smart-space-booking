"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getReservationById,
  startPayment,
  syncPayment,
  Reservation,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/components/SpaceCard";
import { QrCodeCard } from "@/components/QrCodeCard";
import { snapPay } from "@/lib/midtrans-snap";
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  TicketPercent,
  Wallet,
  CreditCard,
  Building,
  QrCode,
  Store,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Lock,
  Download,
  ExternalLink,
} from "lucide-react";

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

interface PaymentOption {
  id: string;
  name: string;
  category: "va" | "ewallet" | "card" | "retail";
  desc: string;
  badge?: string;
  iconType: "bca" | "mandiri" | "bni" | "bri" | "permata" | "qris" | "gopay" | "shopeepay" | "card" | "indomaret" | "alfamart";
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "bca_va",
    name: "BCA Virtual Account",
    category: "va",
    desc: "Transfer via BCA Mobile, KlikBCA, atau ATM BCA",
    badge: "Otomatis & Realtime",
    iconType: "bca",
  },
  {
    id: "mandiri_va",
    name: "Mandiri Virtual Account",
    category: "va",
    desc: "Transfer via Livin' by Mandiri, Internet Banking, atau ATM",
    badge: "Populer",
    iconType: "mandiri",
  },
  {
    id: "bni_va",
    name: "BNI Virtual Account",
    category: "va",
    desc: "Transfer via BNI Mobile Banking, SMS Banking, atau ATM",
    iconType: "bni",
  },
  {
    id: "bri_va",
    name: "BRI Virtual Account (BRIVA)",
    category: "va",
    desc: "Transfer via BRImo, Internet Banking BRI, atau ATM",
    badge: "Populer",
    iconType: "bri",
  },
  {
    id: "permata_va",
    name: "Permata & Bank Lainnya",
    category: "va",
    desc: "Transfer dari CIMB, Danamon, BSI, atau Bank Lain via VA",
    iconType: "permata",
  },
  {
    id: "qris",
    name: "QRIS & GoPay / ShopeePay",
    category: "ewallet",
    desc: "Scan QRIS instan via GoPay, OVO, DANA, BCA, ShopeePay, dll.",
    badge: "Instan 1 Detik",
    iconType: "qris",
  },
  {
    id: "credit_card",
    name: "Kartu Kredit / Debit Online",
    category: "card",
    desc: "Mendukung Visa, Mastercard, JCB, dan American Express (3D Secure)",
    iconType: "card",
  },
  {
    id: "alfamart_indomaret",
    name: "Gerai Retail (Indomaret / Alfamart)",
    category: "retail",
    desc: "Bayar tunai di kasir gerai Indomaret atau Alfamart terdekat",
    iconType: "alfamart",
  },
];

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const resolvedParams = use(params);
  const reservationId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("bca_va");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState(false);

  const fetchReservation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReservationById(reservationId);
      setReservation(data);
      if (data.transaksi?.statusPembayaran === "lunas") {
        setPaySuccess(true);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reservationId) {
      fetchReservation();
    }
  }, [reservationId]);

  const handlePayNow = async () => {
    if (!reservation) return;
    setPaying(true);
    setPayError(null);

    try {
      const response = await startPayment(reservation.id);
      const result = response.data;

      // Optional: Open Midtrans direct standalone page if popup is blocked
      if (result.redirectUrl) {
        window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
      }

      await snapPay(result.clientKey, result.snapScriptUrl, result.snapToken, {
        onSuccess: async () => {
          try {
            await syncPayment(result.transactionId);
          } catch {}
          setPaySuccess(true);
          setPaying(false);
          await fetchReservation();
        },
        onPending: async () => {
          try {
            await syncPayment(result.transactionId);
          } catch {}
          setPaySuccess(true);
          setPaying(false);
          await fetchReservation();
        },
        onError: () => {
          setPayError("Pembayaran gagal atau dibatalkan oleh gateway Midtrans.");
          setPaying(false);
        },
        onClose: () => {
          setPaying(false);
        },
      });
    } catch (err: unknown) {
      setPayError(getApiErrorMessage(err));
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-slate-50">
        <div className="flex flex-col items-center gap-2.5 text-slate-500">
          <Loader2 className="w-7 h-7 text-cyan-600 animate-spin" />
          <p className="text-xs font-semibold">Memuat rincian pesanan checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">{error || "Data reservasi tidak tersedia atau telah dihapus."}</p>
        <Link
          href="/spaces"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>
    );
  }

  const space = reservation.detailReservasi?.space;
  const owner = reservation.owner || space?.owner;
  const diskon = reservation.detailReservasi?.diskon;
  const totalHarga = reservation.detailReservasi?.totalHarga || reservation.transaksi?.jumlah || 0;
  const basePrice = space ? space.hargaPerJam * reservation.durasiJam : totalHarga;
  const discountAmount = Math.max(0, basePrice - totalHarga);

  const rawDate = reservation.tanggalReservasi ? reservation.tanggalReservasi.split("T")[0] : "-";
  const formattedDate = new Date(rawDate + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100/70 pb-28">
      {/* Top Header / Breadcrumb */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Checkout Pembayaran</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                  {reservation.transaksi?.nomorInvoice || `INV-RES#${reservation.id}`}
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">Periksa detail pesanan dan selesaikan transaksi.</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="text-slate-700">1. Jadwal</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-cyan-700 font-bold bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              2. Review & Pembayaran
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>3. E-Tiket Pass</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
        {paySuccess ? (
          /* Payment Success State */
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-sm space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-100 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Transaksi Lunas & Terverifikasi</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Pembayaran Berhasil!
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Terima kasih, pembayaran sebesar{" "}
                <strong className="text-slate-800 font-mono">{formatRupiah(totalHarga)}</strong> telah diterima. Tiket QR Anda sekarang aktif dan dapat langsung ditunjukkan ke resepsionis saat check-in.
              </p>
            </div>

            <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 max-w-sm mx-auto flex flex-col items-center justify-center space-y-3">
              <QrCodeCard
                value={reservation.qrCode}
                size={140}
                label="Tiket Akses Masuk"
              />
              <p className="text-[11px] font-mono text-slate-500">{reservation.qrCode}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
              <Link
                href="/dashboard/member"
                className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-2"
              >
                <span>Buka Tiket di Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/spaces"
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all text-center"
              >
                <span>Jelajahi Ruangan Lain</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Shopee-Style Section 1: Data Pemesan & Lokasi */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500" />
              <div className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-700">
                  <User className="w-4 h-4 text-cyan-600" />
                  <span>Informasi Pemesan (Member)</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-sm">
                      {reservation.member?.namaMember || user?.member?.namaMember || "Member WorkNest"}
                    </p>
                    <p className="text-slate-600 flex items-center gap-2 flex-wrap">
                      <span className="font-mono">{reservation.member?.telp || user?.member?.telp || "081234567890"}</span>
                      <span className="text-slate-300">•</span>
                      <span>{user?.email}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{reservation.member?.instansi || "Umum / Personal"}</span>
                    </p>
                  </div>
                  <span className="self-start sm:self-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Terverifikasi</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Shopee-Style Section 2: Toko Coworking & Rincian Ruangan */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              {/* Coworking Store Header */}
              <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">
                      {owner?.namaCoworking || "WorkNest Space Partner"}
                    </h3>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{owner?.alamat || "Lokasi Coworking Space"}</span>
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white text-slate-700 border border-slate-200">
                  Official Partner
                </span>
              </div>

              {/* Product Item Row */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={
                        space?.foto ||
                        "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=300&q=80"
                      }
                      alt={space?.namaSpace || "Ruangan"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                        {space?.tipe === "desk"
                          ? "Hot Desk"
                          : space?.tipe === "meeting_room"
                          ? "Meeting Room"
                          : "Private Office"}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Kapasitas {space?.kapasitas || 1} Orang
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {space?.namaSpace || "Ruangan Kerja"}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                        <span>{formattedDate}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-600" />
                        <span>
                          {reservation.jamMulai} - {reservation.jamSelesai || `${parseInt(reservation.jamMulai) + reservation.durasiJam}:00`} WIB ({reservation.durasiJam} Jam)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right sm:self-center self-end space-y-0.5 shrink-0">
                  <p className="text-[11px] text-slate-400">
                    {formatRupiah(space?.hargaPerJam || 0)} × {reservation.durasiJam} jam
                  </p>
                  <p className="font-extrabold text-slate-900 text-base font-mono">
                    {formatRupiah(basePrice)}
                  </p>
                </div>
              </div>

              {/* Coupon / Voucher Row if applied */}
              {diskon && (
                <div className="px-4 sm:px-5 py-3 bg-emerald-50/60 border-t border-emerald-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-medium">
                    <TicketPercent className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Kupon Promo: <strong className="font-bold">{diskon.kodeDiskon || diskon.namaDiskon}</strong> ({diskon.persentaseDiskon}% OFF)
                    </span>
                  </div>
                  <span className="font-bold font-mono text-emerald-700">
                    - {formatRupiah(discountAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Shopee-Style Section 3: Pilih Metode Pembayaran */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-cyan-600" />
                    <span>Pilih Metode Pembayaran</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih bank atau saluran pembayaran favorit Anda via Midtrans Gateway.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  Midtrans 100% Secure
                </span>
              </div>

              {payError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{payError}</span>
                </div>
              )}

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PAYMENT_OPTIONS.map((opt) => {
                  const isSelected = selectedPaymentMethod === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedPaymentMethod(opt.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-50/40 shadow-xs ring-1 ring-cyan-500/30"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="pt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-cyan-600 bg-cyan-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-slate-900 text-xs">{opt.name}</p>
                          {opt.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shopee-Style Section 4: Ringkasan Tagihan Finansial */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Ringkasan Pembayaran
              </h3>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal Sewa Ruangan ({reservation.durasiJam} jam)</span>
                  <span className="font-mono text-slate-900 font-semibold">{formatRupiah(basePrice)}</span>
                </div>

                {diskon && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Potongan Kupon Promo ({diskon.persentaseDiskon}%)</span>
                    <span className="font-mono font-bold">- {formatRupiah(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500">
                  <span>Biaya Layanan & Penanganan Gateway</span>
                  <span className="font-mono font-semibold text-emerald-700">Gratis (Rp 0)</span>
                </div>

                <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900">Total Tagihan Pembayaran</span>
                    <p className="text-[10px] text-slate-400">Sudah termasuk PPN & fasilitas standar</p>
                  </div>
                  <span className="text-xl font-extrabold text-cyan-700 font-mono">
                    {formatRupiah(totalHarga)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shopee-Style Bottom Sticky Checkout Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-[11px] text-slate-500">Total Pembayaran:</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
                    {formatRupiah(totalHarga)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handlePayNow}
                    disabled={paying}
                    className="py-3 px-6 sm:px-8 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-cyan-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membuka Midtrans...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Bayar Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
