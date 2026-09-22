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
  Calendar,
  ShieldCheck,
  Receipt,
  Download,
  CheckCheck,
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
    iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
    iconBg: "bg-sky-50 text-sky-600 border-sky-200",
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
  const [countdown, setCountdown] = useState<number | null>(null);

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

      // ONLY set paySuccess if the payment is strictly "lunas"
      if (data.transaksi?.statusPembayaran === "lunas") {
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

  useEffect(() => {
    if (!paySuccess || countdown === null) return;

    if (countdown <= 0) {
      router.push(targetRedirectUrl);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
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

    if (!isSettled && reservationId) {
      try {
        const checkData = await getReservationById(reservationId);
        if (checkData.transaksi?.statusPembayaran === "lunas") {
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

  useEffect(() => {
    if (modalOpen && !paySuccess) {
      pollingRef.current = setInterval(async () => {
        await verifyStatus(paymentDetails?.orderId);
      }, 5000);
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

    try {
      const paymentRes = await startPayment(reservation.id, selectedMethod);
      const paymentData = paymentRes.data;
      const direct = paymentData?.directPayment;

      setPaymentDetails({
        vaNumber: direct?.vaNumber || undefined,
        qrString: direct?.qrString || reservation.qrCode,
        billerCode: direct?.billerCode || (selectedMethod === "mandiri_bill" ? "70012" : undefined),
        billKey: direct?.billKey || undefined,
        paymentCode: direct?.paymentCode || undefined,
        orderId: direct?.orderId || paymentData?.nomorInvoice || String(paymentData?.transactionId),
      });

      if (paymentData?.transactionId) {
        setReservation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            transaksi: {
              ...(prev.transaksi as any),
              id: paymentData.transactionId,
              nomorInvoice: paymentData.nomorInvoice,
              jumlah: paymentData.jumlah,
              snapToken: paymentData.snapToken,
              snapRedirectUrl: paymentData.redirectUrl,
            },
          };
        });
      }

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-400">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-2" />
        <p className="text-xs font-semibold text-slate-600">Memuat rincian pembayaran...</p>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Gagal Memuat Checkout</h2>
          <p className="text-xs text-slate-500">
            {error || "Rincian reservasi tidak tersedia atau telah kedaluwarsa."}
          </p>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-sky-600/25 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Ruangan</span>
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUCCESS SCREEN (Payment is actually paid)
  // ==========================================
  if (paySuccess) {
    return (
      <div className="min-h-[80vh] py-10 sm:py-16 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
          {/* Ambient background glow */}
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-100/70 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-sky-100/70 rounded-full blur-3xl pointer-events-none" />

          {/* Success Animated Icon */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-60" />
            <div className="relative w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCheck className="w-8 h-8 stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-1.5 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pembayaran Berhasil Diverifikasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Selamat, Tiket Anda Telah Aktif!
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Transaksi pembayaran telah lunas. Simpan dan gunakan QR Code di bawah untuk check-in di terminal resepsionis venue.
            </p>
          </div>

          {/* Digital Ticket Card */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-left space-y-3.5 relative z-10">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{roomName}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{address}</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                LUNAS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-mono">TANGGAL SEWA</span>
                <span className="font-bold text-slate-800">{reservationDate}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-mono">JAM PEMAKAIAN</span>
                <span className="font-bold text-slate-800">{startTime} - {endTime} WIB</span>
              </div>
            </div>

            {/* Render Ticket QR Code */}
            {reservation.qrCode && (
              <div className="pt-1">
                <QrCodeCard
                  value={reservation.qrCode}
                  label="KODE QR TIKET MASUK"
                  size={140}
                  showDownload={true}
                  className="bg-white border-slate-200"
                />
              </div>
            )}

            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Total Terbayar:</span>
              <span className="font-mono font-bold text-emerald-600 text-sm">
                {formatRupiah(amountDue)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 relative z-10 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/member"
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Buka Tiket Saya</span>
              </Link>
              <Link
                href="/dashboard/member/transactions"
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>Riwayat Transaksi</span>
              </Link>
            </div>

            <Link
              href="/spaces"
              className="inline-block text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline pt-1"
            >
              &larr; Sewa Ruangan Lainnya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // NORMAL CHECKOUT & PAYMENT METHOD SELECTOR
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-600 mb-1">
            <Link href="/spaces" className="hover:underline">KATALOG</Link>
            <span className="text-slate-300">&gt;</span>
            <Link href={`/spaces/${space?.id || ""}`} className="hover:underline">DETAIL</Link>
            <span className="text-slate-300">&gt;</span>
            <span>CHECKOUT #{reservation.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pembayaran &amp; Konfirmasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Pilih metode pembayaran di bawah. Setelah menekan tombol bayar, popup nomor VA atau barcode QRIS resmi akan langsung muncul.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-sky-700 bg-sky-50 px-3.5 py-1.5 rounded-xl border border-sky-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Sisa Waktu: {formatTime(holdTimer)}</span>
          </div>
        </div>
      </div>

      {payError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start justify-between gap-2.5 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{payError}</span>
          </div>
          <button type="button" onClick={() => setPayError(null)} className="font-bold text-rose-600 p-0.5 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Payment Method Selector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-600" />
                <h2 className="text-sm font-bold text-slate-900">Pilih Metode Pembayaran</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Midtrans Payment Gateway</span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Virtual Account Otomatis
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PAYMENT_OPTIONS.filter((p) => p.category === "va").map((opt) => {
                  const isSelected = selectedMethod === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedMethod(opt.key)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                      }`}
                    >
                      <div className={`w-10 h-7 rounded-md font-bold text-[10px] font-mono flex items-center justify-center shrink-0 border ${opt.iconBg}`}>
                        {opt.badge}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{opt.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                QRIS &amp; E-Wallet
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PAYMENT_OPTIONS.filter((p) => p.category === "qris").map((opt) => {
                  const isSelected = selectedMethod === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedMethod(opt.key)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                      }`}
                    >
                      <div className={`w-10 h-7 rounded-md font-bold text-[10px] font-mono flex items-center justify-center shrink-0 border ${opt.iconBg}`}>
                        {opt.badge}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{opt.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Lainnya (Kartu &amp; Gerai)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PAYMENT_OPTIONS.filter((p) => p.category === "other").map((opt) => {
                  const isSelected = selectedMethod === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedMethod(opt.key)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                      }`}
                    >
                      <div className={`w-10 h-7 rounded-md font-bold text-[10px] font-mono flex items-center justify-center shrink-0 border ${opt.iconBg}`}>
                        {opt.badge}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{opt.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Summary & Pay Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Ringkasan Tagihan</h2>
              <span className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100 uppercase">
                {spaceType}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{roomName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{address}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Jadwal Reservasi</span>
                  <span className="font-bold text-slate-900">{reservationDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jam Pemakaian</span>
                  <span className="font-mono text-slate-900 font-semibold">{startTime} - {endTime} WIB ({duration} Jam)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarif Sewa</span>
                  <span className="font-mono text-slate-900">{formatRupiah(hourlyRate)} / jam</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Terpilih</span>
                  <span className="font-bold text-sky-700">{selectedOption.name}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-slate-900">Total Pembayaran</p>
                  <p className="text-[10px] text-slate-400">Termasuk pajak &amp; biaya platform</p>
                </div>
                <span className="text-xl font-extrabold font-mono text-sky-600">
                  {formatRupiah(amountDue)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayNow}
              disabled={paying}
              className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-sm font-bold rounded-xl shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {paying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Pembayaran...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Bayar Sekarang ({formatRupiah(amountDue)})</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-slate-400 leading-tight">
              Pembayaran aman dan terenkripsi menggunakan sistem Midtrans Payment Gateway.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Instructions / VA Modal Popup */}
      {modalOpen && paymentDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-600 uppercase">
                  PETUNJUK PEMBAYARAN
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedOption.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* VA or QRIS Display */}
            {paymentDetails.vaNumber && (
              <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl space-y-2 text-center">
                <span className="text-[11px] font-medium text-slate-500">Nomor Virtual Account</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 select-all">
                    {paymentDetails.vaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentDetails.vaNumber || "");
                      setCopiedVA(true);
                      setTimeout(() => setCopiedVA(false), 2000);
                    }}
                    className="p-1.5 rounded-lg bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 cursor-pointer shadow-2xs"
                    title="Salin Nomor VA"
                  >
                    {copiedVA ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Order ID: {paymentDetails.orderId || `TRX-${reservation.id}`}
                </p>
              </div>
            )}

            {paymentDetails.qrString && selectedOption.category === "qris" && (
              <div className="text-center space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block">Pindai QRIS Menggunakan Aplikasi Bank / E-Wallet</span>
                <div className="flex justify-center">
                  <QrCodeCard value={paymentDetails.qrString} size={180} showCopy={false} />
                </div>
              </div>
            )}

            {paymentDetails.billKey && paymentDetails.billerCode && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Kode Perusahaan (Biller Code):</span>
                  <strong className="font-mono text-slate-900">{paymentDetails.billerCode}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nomor Bill Key:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="font-mono text-slate-900 select-all">{paymentDetails.billKey}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentDetails.billKey || "");
                        setCopiedBillKey(true);
                        setTimeout(() => setCopiedBillKey(false), 2000);
                      }}
                      className="p-1 text-sky-600 hover:text-sky-800 cursor-pointer"
                    >
                      {copiedBillKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Total Amount to Pay */}
            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Tagihan:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-slate-900 text-sm">
                  {formatRupiah(amountDue)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(String(amountDue));
                    setCopiedAmount(true);
                    setTimeout(() => setCopiedAmount(false), 2000);
                  }}
                  className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Manual Check Status Action */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleManualCheckStatus}
                disabled={syncingStatus}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {syncingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memeriksa Status Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Saya Sudah Bayar (Cek Status Sekarang)</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Sistem otomatis memverifikasi pembayaran Anda setiap beberapa detik.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
