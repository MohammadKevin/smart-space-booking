"use client";

import React, { useEffect, useState, use, useMemo, useRef, useCallback } from "react";
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
import DashboardLayout from "@/app/dashboard/layout";
import { QrCodeCard } from "@/components/QrCodeCard";
import {
  Clock,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
  Check,
  Copy,
  X,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Ticket,
  Building,
} from "lucide-react";

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export type PaymentMethodKey =
  | "bca_va"
  | "mandiri_bill"
  | "bni_va"
  | "bri_va"
  | "permata_va"
  | "qris"
  | "gopay"
  | "shopeepay"
  | "credit_card"
  | "cstore";

interface PaymentOption {
  key: PaymentMethodKey;
  name: string;
  category: "va" | "qris" | "other";
  badge: string;
  desc: string;
  bankCode?: string;
  iconBg: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    key: "bca_va",
    name: "BCA Virtual Account",
    category: "va",
    badge: "BCA",
    desc: "Transfer via m-BCA, KlikBCA, atau ATM BCA",
    bankCode: "BCA",
    iconBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    key: "mandiri_bill",
    name: "Mandiri Virtual Account (Bill)",
    category: "va",
    badge: "MANDIRI",
    desc: "Transfer via Livin' by Mandiri atau ATM Mandiri",
    bankCode: "MANDIRI",
    iconBg: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    key: "bni_va",
    name: "BNI Virtual Account",
    category: "va",
    badge: "BNI",
    desc: "Transfer via BNI Mobile Banking atau ATM BNI",
    bankCode: "BNI",
    iconBg: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    key: "bri_va",
    name: "BRI Virtual Account (BRIVA)",
    category: "va",
    badge: "BRI",
    desc: "Transfer via BRImo atau ATM BRI",
    bankCode: "BRI",
    iconBg: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    key: "permata_va",
    name: "Permata Virtual Account",
    category: "va",
    badge: "PERMATA",
    desc: "Transfer via PermataMobile X atau ATM",
    bankCode: "PERMATA",
    iconBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    key: "qris",
    name: "QRIS Instant (Semua Bank & E-Wallet)",
    category: "qris",
    badge: "QRIS",
    desc: "BCA, GoPay, OVO, DANA, ShopeePay, LinkAja",
    iconBg: "bg-cyan-50 text-[#006370] border-[#BCE3DE]",
  },
  {
    key: "gopay",
    name: "GoPay / GoPay App",
    category: "qris",
    badge: "GoPay",
    desc: "Buka langsung di aplikasi GoPay / Gojek",
    iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    key: "shopeepay",
    name: "ShopeePay",
    category: "qris",
    badge: "ShopeePay",
    desc: "Pembayaran via aplikasi Shopee",
    iconBg: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    key: "credit_card",
    name: "Kartu Kredit / Debit Online",
    category: "other",
    badge: "3D Secure",
    desc: "Visa, Mastercard, JCB berlogo resmi",
    iconBg: "bg-slate-100 text-slate-800 border-slate-200",
  },
  {
    key: "cstore",
    name: "Indomaret / Alfamart",
    category: "other",
    badge: "Retail",
    desc: "Bayar tunai di kasir minimarket terdekat",
    iconBg: "bg-amber-50 text-amber-800 border-amber-200",
  },
];

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const resolvedParams = use(params);
  const reservationId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { user } = useAuth();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodKey>("bca_va");
  const [holdTimer, setHoldTimer] = useState(15 * 60);

  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(4);

  const [modalOpen, setModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    vaNumber?: string;
    qrString?: string;
    billerCode?: string;
    billKey?: string;
    paymentCode?: string;
    orderId?: string;
  } | null>(null);

  const [copiedVA, setCopiedVA] = useState(false);
  const [copiedBillKey, setCopiedBillKey] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [syncingStatus, setSyncingStatus] = useState(false);
  const [guideTab, setGuideTab] = useState<"mbanking" | "atm" | "internet">("mbanking");

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setHoldTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const fetchReservation = useCallback(async () => {
    if (!reservationId || isNaN(reservationId)) {
      setError("ID Reservasi tidak valid.");
      setLoading(false);
      return;
    }

    try {
      const data = await getReservationById(reservationId);
      setReservation(data);
      if (
        data.transaksi?.statusPembayaran === "lunas" ||
        data.status === "disetujui" ||
        data.status === "aktif"
      ) {
        setPaySuccess(true);
      }
    } catch (err) {
      setError(
        getApiErrorMessage(err) ||
          "Data reservasi tidak ditemukan atau sesi telah berakhir."
      );
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    if (reservationId) {
      fetchReservation();
    }
  }, [reservationId, fetchReservation]);

  const targetRedirectUrl = useMemo(() => {
    const r = user?.role?.toLowerCase();
    if (r === "admin_space" || r === "owner") return "/dashboard/owner/reservations";
    return "/dashboard/member";
  }, [user]);

  // Auto redirect countdown on paySuccess
  useEffect(() => {
    if (!paySuccess) return;

    if (countdown <= 0) {
      router.push(targetRedirectUrl);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [paySuccess, countdown, router, targetRedirectUrl]);

  const verifyStatus = useCallback(async (orderId?: string) => {
    const activeOrderId = orderId || paymentDetails?.orderId || reservation?.transaksi?.midtransOrderId;
    const txId = reservation?.transaksi?.id;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("access_token")
        : null;

    let isSettled = false;

    // 1. Check direct Midtrans status API
    try {
      const queryParams = new URLSearchParams();
      if (activeOrderId) queryParams.set("orderId", activeOrderId);
      if (reservationId) queryParams.set("reservationId", String(reservationId));
      if (txId) queryParams.set("transactionId", String(txId));

      const res = await fetch(`/api/charge/status?${queryParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.isPaid || data.transactionStatus === "settlement" || data.transactionStatus === "capture") {
        isSettled = true;
      }
    } catch {}

    // 2. Also check backend sync endpoint
    if (!isSettled && (txId || reservationId)) {
      try {
        const syncId = txId || reservationId;
        const syncRes = await syncPayment(syncId);
        const updated = syncRes?.data || syncRes;
        if (updated?.statusPembayaran === "lunas" || updated?.status === "lunas") {
          isSettled = true;
        }
      } catch {}
    }

    // 3. Check reservation status
    if (!isSettled && reservationId) {
      try {
        const checkData = await getReservationById(reservationId);
        if (
          checkData.transaksi?.statusPembayaran === "lunas" ||
          checkData.status === "disetujui" ||
          checkData.status === "aktif"
        ) {
          isSettled = true;
          setReservation(checkData);
        }
      } catch {}
    }

    if (isSettled) {
      setPaySuccess(true);
      setModalOpen(false);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return true;
    }

    return false;
  }, [paymentDetails?.orderId, reservation?.transaksi?.midtransOrderId, reservation?.transaksi?.id, reservationId]);

  // Real-time auto-polling every 6 seconds while modal is open (BUG-013)
  useEffect(() => {
    if (modalOpen && !paySuccess) {
      pollingRef.current = setInterval(async () => {
        await verifyStatus(paymentDetails?.orderId);
      }, 6000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [modalOpen, paySuccess, verifyStatus, paymentDetails?.orderId]);

  const handlePayNow = async () => {
    if (!reservation) return;
    setPaying(true);
    setPayError(null);

    const space = reservation.detailReservasi?.space;
    const amountDue =
      reservation.detailReservasi?.totalHarga ||
      (space?.hargaPerJam || 50000) * (reservation.durasiJam || 1);

    try {
      try {
        await startPayment(reservation.id, selectedMethod);
      } catch {}

      const chargeRes = await fetch("/api/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservation.id,
          invoiceNumber: reservation.transaksi?.nomorInvoice || `INV-RES-${reservation.id}`,
          amount: amountDue,
          paymentMethod: selectedMethod,
          customerName: user?.member?.namaMember || user?.email || "Member WorkNest",
          customerEmail: user?.email || "member@worknest.id",
          customerPhone: user?.member?.telp || "081234567890",
        }),
      });

      const chargeData = await chargeRes.json();

      if (!chargeRes.ok || !chargeData.success) {
        throw new Error(chargeData.message || "Gagal menghasilkan nomor tagihan dari gateway.");
      }

      setPaymentDetails({
        vaNumber: chargeData.vaNumber || undefined,
        qrString: chargeData.qrString || reservation.qrCode,
        billerCode: chargeData.billerCode || (selectedMethod === "mandiri_bill" ? "70012" : undefined),
        billKey: chargeData.billKey || undefined,
        paymentCode: chargeData.paymentCode || undefined,
        orderId: chargeData.orderId,
      });

      setModalOpen(true);
    } catch (err: any) {
      setPayError(
        getApiErrorMessage(err) || "Gagal memproses pembayaran melalui gateway Midtrans."
      );
    } finally {
      setPaying(false);
    }
  };

  const handleManualCheckStatus = async () => {
    setSyncingStatus(true);
    try {
      const settled = await verifyStatus(paymentDetails?.orderId);
      if (!settled) {
        await fetchReservation();
      }
    } catch (err: unknown) {
      setPayError(getApiErrorMessage(err));
    } finally {
      setSyncingStatus(false);
    }
  };

  const space = reservation?.detailReservasi?.space;
  const roomName = space?.namaSpace || "Ruang Kerja";
  const address = space?.owner?.alamat || space?.owner?.namaCoworking || "Lokasi mitra WorkNest";
  const hourlyRate = space?.hargaPerJam || 0;
  const duration = reservation?.durasiJam || 1;
  const rentalSubtotal = hourlyRate * duration;
  const amountDue = reservation?.detailReservasi?.totalHarga || rentalSubtotal;
  const capacity = space?.kapasitas || 0;
  const spaceType = space?.tipe ? space.tipe.replace(/_/g, " ").toUpperCase() : "WORKSPACE";

  const reservationDate = reservation?.tanggalReservasi
    ? reservation.tanggalReservasi.split("T")[0]
    : "-";
  const startTime = reservation?.jamMulai || "09:00";
  const startHour = parseInt(startTime.split(":")[0] || "9", 10);
  const endHour = startHour + duration;
  const endTime = `${String(endHour).padStart(2, "0")}:00`;

  const selectedOption = useMemo(() => {
    return PAYMENT_OPTIONS.find((p) => p.key === selectedMethod) || PAYMENT_OPTIONS[0];
  }, [selectedMethod]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#006370] mb-2" />
          <p className="text-xs">Memuat rincian checkout...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !reservation) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-xs bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Reservasi Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500">
            {error || "Rincian reservasi tidak tersedia atau telah kedaluwarsa."}
          </p>
          <Link
            href="/dashboard/member/spaces"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-semibold rounded-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Ruangan</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
              <span>CHECKOUT RESERVASI</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-sans font-normal">
                Tagihan #{reservation.id}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Pembayaran &amp; Konfirmasi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Pilih metode pembayaran di bawah. Setelah menekan tombol bayar, popup rincian nomor VA / QRIS dan panduan pembayaran akan langsung muncul.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#006370] bg-[#E6F4F2] px-3 py-1.5 rounded-xs border border-[#BCE3DE]">
              <Clock className="w-3.5 h-3.5 text-[#006370]" />
              <span>Sisa Waktu: {formatTime(holdTimer)}</span>
            </div>
          </div>
        </div>

        {payError && (
          <div className="p-4 rounded-xs bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{payError}</span>
          </div>
        )}

        {paySuccess ? (
          <div className="bg-white border border-slate-200 rounded-xs p-8 text-center space-y-6 shadow-2xl max-w-lg mx-auto relative overflow-hidden animate-in fade-in zoom-in-95">
            {/* Background glowing aura */}
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-100 rounded-full blur-3xl pointer-events-none opacity-60" />
            <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-[#E6F4F2] rounded-full blur-3xl pointer-events-none opacity-60" />

            {/* Checkmark Icon Animation */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-100/70 animate-ping opacity-75" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Check className="w-9 h-9 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1.5 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-xs bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold font-mono uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Transaksi Lunas &amp; Terverifikasi</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                Pembayaran Berhasil!
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Reservasi ruangan Anda telah lunas. Akses kode QR dan kunci digital telah diaktifkan secara instan.
              </p>
            </div>

            {/* Ticket Snapshot Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xs text-left space-y-2 text-xs relative z-10">
              <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Ticket className="w-4 h-4 text-[#006370]" />
                  <span>{roomName}</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-[#006370] bg-[#E6F4F2] px-2 py-0.5 rounded-xs border border-[#BCE3DE]">
                  {reservation?.qrCode || `RES-${reservation?.id}`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Waktu Sesi</span>
                  <span className="font-semibold text-slate-900">{reservationDate} • {startTime} WIB</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Total Dibayar</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">{formatRupiah(amountDue)}</span>
                </div>
              </div>
            </div>

            {/* Countdown and Progress Bar */}
            <div className="space-y-1.5 text-xs text-slate-500 font-medium relative z-10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 text-[#006370] animate-spin" />
                  <span>Mengalihkan ke halaman tiket...</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{countdown}s</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#006370] transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${((4 - countdown) / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center relative z-10">
              <Link
                href={targetRedirectUrl}
                className="flex-1 py-2.5 px-4 bg-[#006370] text-white rounded-xs text-xs font-bold shadow-2xs hover:bg-[#004f59] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Buka Tiket Saya Sekarang</span>
              </Link>
              <Link
                href="/dashboard/member/transactions"
                className="py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xs text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Lihat Invoice
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-xs border border-slate-200 p-6 space-y-5 shadow-2xs">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-base font-bold text-slate-900">
                      Pilihan Metode Pembayaran Midtrans
                    </h2>
                    <p className="text-xs text-slate-500">
                      Pilih kanal transfer bank (BCA, Mandiri, BNI, BRI, Permata) atau QRIS / E-Wallet.
                    </p>
                  </div>
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      TRANSFER VIRTUAL ACCOUNT (VERIFIKASI OTOMATIS 24 JAM)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {PAYMENT_OPTIONS.filter((p) => p.category === "va").map((opt) => {
                        const isSelected = selectedMethod === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setSelectedMethod(opt.key)}
                            className={`p-3.5 rounded-xs border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#006370] bg-[#E6F4F2]/50 shadow-2xs ring-1 ring-[#006370]/20"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`px-2 py-0.5 rounded-xs text-[9px] font-mono font-bold border ${opt.iconBg}`}>
                                {opt.bankCode || opt.badge}
                              </span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? "bg-[#006370] border-[#006370]" : "border-slate-300"}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                            <p className="font-bold text-slate-900 text-xs leading-snug">{opt.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      QRIS &amp; INSTANT E-WALLET
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {PAYMENT_OPTIONS.filter((p) => p.category === "qris").map((opt) => {
                        const isSelected = selectedMethod === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setSelectedMethod(opt.key)}
                            className={`p-3.5 rounded-xs border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#006370] bg-[#E6F4F2]/50 shadow-2xs ring-1 ring-[#006370]/20"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`px-2 py-0.5 rounded-xs text-[9px] font-mono font-bold border ${opt.iconBg}`}>
                                {opt.badge}
                              </span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? "bg-[#006370] border-[#006370]" : "border-slate-300"}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                            <p className="font-bold text-slate-900 text-xs leading-snug">{opt.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      KARTU KREDIT &amp; GERAI RETAIL
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {PAYMENT_OPTIONS.filter((p) => p.category === "other").map((opt) => {
                        const isSelected = selectedMethod === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setSelectedMethod(opt.key)}
                            className={`p-3.5 rounded-xs border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#006370] bg-[#E6F4F2]/50 shadow-2xs ring-1 ring-[#006370]/20"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`px-2 py-0.5 rounded-xs text-[9px] font-mono font-bold border ${opt.iconBg}`}>
                                {opt.badge}
                              </span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? "bg-[#006370] border-[#006370]" : "border-slate-300"}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                            <p className="font-bold text-slate-900 text-xs leading-snug">{opt.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xs border border-slate-200 p-6 space-y-4 shadow-2xs">
                <h3 className="font-serif text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Rincian Pemesanan Ruangan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono uppercase">Ruangan</span>
                    <strong className="text-slate-900 text-sm">{roomName}</strong>
                    <span className="text-[11px] text-slate-500 block font-mono mt-0.5">{spaceType} • {capacity} Orang</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono uppercase">Lokasi Venue</span>
                    <strong className="text-slate-900">{space?.owner?.namaCoworking || "WorkNest Hub"}</strong>
                    <span className="text-[11px] text-slate-500 block truncate">{address}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono uppercase">Jadwal Sesi</span>
                    <strong className="text-slate-900">{reservationDate}</strong>
                    <span className="text-[11px] text-slate-500 block font-mono">{startTime} - {endTime} WIB ({duration} Jam)</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono uppercase">Nama Pemesan</span>
                    <strong className="text-slate-900">{user?.member?.namaMember || user?.email || "Member"}</strong>
                    <span className="text-[11px] text-slate-500 block font-mono">{user?.member?.telp || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
              <div className="bg-white rounded-xs border border-slate-200 p-5 space-y-4 shadow-2xs">
                <h3 className="font-serif text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Ringkasan Tagihan
                </h3>

                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Sewa ({formatRupiah(hourlyRate)} &times; {duration} jam)</span>
                    <span className="font-mono font-semibold text-slate-900">{formatRupiah(rentalSubtotal)}</span>
                  </div>

                  {amountDue < rentalSubtotal && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Potongan Diskon</span>
                      <span className="font-mono">-{formatRupiah(rentalSubtotal - amountDue)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">Total Pembayaran</span>
                    <span className="text-lg font-bold text-[#006370] font-mono">
                      {formatRupiah(amountDue)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xs border border-slate-200 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <CreditCard className="w-3.5 h-3.5 text-[#006370]" />
                      <span>{selectedOption.name}</span>
                    </div>
                    <p className="leading-relaxed">Nomor VA &amp; panduan akan langsung muncul pada popup setelah klik Bayar Sekarang.</p>
                  </div>
                </div>

                {holdTimer <= 0 && !paySuccess ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xs text-xs text-amber-900 space-y-2 text-center">
                    <p className="font-semibold">Sesi Pembayaran Telah Berakhir</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">Batas waktu penahanan slot (15 menit) telah habis. Slot ruangan telah dilepaskan kembali.</p>
                    <div className="pt-1">
                      <Link
                        href={`/booking/${reservation?.detailReservasi?.spaceId || ""}`}
                        className="inline-block px-3.5 py-1.5 bg-[#006370] hover:bg-[#004f59] text-white rounded-xs text-xs font-bold transition-colors"
                      >
                        Pesan Ulang Ruangan
                      </Link>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePayNow}
                    disabled={paying || holdTimer <= 0}
                    className="w-full py-2.5 px-4 rounded-xs bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyiapkan Nomor VA...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar Sekarang ({formatRupiah(amountDue)})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {modalOpen && paymentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xs max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center border border-[#BCE3DE]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedOption.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">Instruksi Pembayaran &amp; Konfirmasi Real-Time</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xs hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xs bg-slate-50 border border-slate-200 space-y-3">
                {selectedOption.category === "qris" ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      SCAN QRIS CODE DI BAWAH
                    </span>
                    <div className="p-3 bg-white rounded-xs border border-slate-200 shadow-xs">
                      <QrCodeCard
                        value={paymentDetails.qrString || reservation.qrCode}
                        size={170}
                        showDownload={true}
                        label="QRIS Standar Bank Indonesia"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Buka aplikasi BCA Mobile, GoPay, OVO, DANA, atau ShopeePay lalu scan QRIS ini.
                    </p>
                  </div>
                ) : selectedMethod === "mandiri_bill" ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-white rounded-xs border border-slate-200">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Kode Perusahaan (Biller)</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono text-sm font-bold text-slate-900">{paymentDetails.billerCode || "70012"}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentDetails.billerCode || "70012");
                            }}
                            className="text-[#006370] text-[10px] font-bold hover:underline cursor-pointer"
                          >
                            Salin
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-xs border border-slate-200">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Nomor Pelanggan (Bill Key)</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono text-sm font-bold text-[#006370]">{paymentDetails.billKey || paymentDetails.vaNumber || String(reservation.id)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentDetails.billKey || paymentDetails.vaNumber || String(reservation.id));
                              setCopiedBillKey(true);
                              setTimeout(() => setCopiedBillKey(false), 2000);
                            }}
                            className="text-[#006370] text-[10px] font-bold hover:underline cursor-pointer"
                          >
                            {copiedBillKey ? "Tersalin" : "Salin"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      NOMOR VIRTUAL ACCOUNT {selectedOption.bankCode || ""}
                    </span>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xs border border-slate-200">
                      <span className="font-mono text-base font-bold text-[#006370] tracking-wider select-all">
                        {paymentDetails.vaNumber || "Membuat VA..."}
                      </span>
                      {paymentDetails.vaNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(paymentDetails.vaNumber || "");
                            setCopiedVA(true);
                            setTimeout(() => setCopiedVA(false), 2000);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer border border-slate-200"
                        >
                          {copiedVA ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedVA ? "Tersalin" : "Salin VA"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Total yang Harus Dibayar</span>
                    <strong className="text-base font-mono font-bold text-slate-900">{formatRupiah(amountDue)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(String(amountDue));
                      setCopiedAmount(true);
                      setTimeout(() => setCopiedAmount(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[10px] transition-colors cursor-pointer border border-slate-200"
                  >
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAmount ? "Tersalin" : "Salin Nominal"}</span>
                  </button>
                </div>
              </div>

              {/* Real-time auto polling indicator */}
              <div className="flex items-center justify-between p-2.5 bg-[#E6F4F2]/50 border border-[#BCE3DE] rounded-xs text-[11px] text-[#006370]">
                <div className="flex items-center gap-2 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Sistem otomatis mengecek status pembayaran Anda setiap 2 detik...</span>
                </div>
              </div>

              {/* Payment guide accordions/tabs */}
              <div className="bg-white rounded-xs border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900 text-xs">Panduan Pembayaran ({selectedOption.badge})</h4>
                  <div className="flex items-center gap-1 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setGuideTab("mbanking")}
                      className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${guideTab === "mbanking" ? "bg-[#006370] text-white font-bold" : "text-slate-500 hover:bg-slate-100"}`}
                    >
                      M-Banking
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuideTab("atm")}
                      className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${guideTab === "atm" ? "bg-[#006370] text-white font-bold" : "text-slate-500 hover:bg-slate-100"}`}
                    >
                      ATM
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuideTab("internet")}
                      className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${guideTab === "internet" ? "bg-[#006370] text-white font-bold" : "text-slate-500 hover:bg-slate-100"}`}
                    >
                      Internet Banking
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                  {guideTab === "mbanking" && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Buka aplikasi Mobile Banking pada ponsel Anda ({selectedOption.bankCode || "Bank Anda"}).</li>
                      <li>Pilih menu <strong>Transfer &gt; Virtual Account</strong> (atau <strong>Bayar / Beli</strong> untuk Mandiri).</li>
                      <li>
                        Masukkan nomor VA / Bill Key:{" "}
                        <strong className="font-mono text-slate-900">
                          {paymentDetails.billKey || paymentDetails.vaNumber || "Nomor VA"}
                        </strong>.
                      </li>
                      <li>Pastikan nama merchant tertera <strong>WorkNest / {space?.owner?.namaCoworking || "Coworking"}</strong> dan nominal <strong>{formatRupiah(amountDue)}</strong>.</li>
                      <li>Konfirmasikan transaksi dengan memasukkan PIN M-Banking Anda.</li>
                    </ol>
                  )}
                  {guideTab === "atm" && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Masukkan kartu ATM dan PIN Anda di mesin ATM terdekat.</li>
                      <li>Pilih menu <strong>Transaksi Lainnya &gt; Transfer &gt; Ke Rek Virtual Account</strong>.</li>
                      <li>Masukkan nomor Virtual Account di atas.</li>
                      <li>Periksa detail pembayaran di layar dan tekan <strong>Ya / Benar</strong>.</li>
                      <li>Simpan struk ATM sebagai bukti pembayaran resmi Anda.</li>
                    </ol>
                  )}
                  {guideTab === "internet" && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Login ke akun Internet Banking Anda.</li>
                      <li>Pilih menu <strong>Pembayaran &gt; Pembayaran Tagihan / Virtual Account</strong>.</li>
                      <li>Pilih rekening sumber dan masukkan nomor Virtual Account.</li>
                      <li>Masukkan kode Token / Key untuk memvalidasi pembayaran.</li>
                    </ol>
                  )}
                </div>
              </div>

              {/* Action button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleManualCheckStatus}
                  disabled={syncingStatus}
                  className="w-full py-2.5 px-4 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white font-bold rounded-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {syncingStatus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Cek Status Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
