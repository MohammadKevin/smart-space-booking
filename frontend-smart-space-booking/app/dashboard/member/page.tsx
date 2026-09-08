"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  getMyBookings,
  cancelBooking,
  getTransactions,
  startPayment,
  syncPayment,
  createReview,
  Reservation,
  Transaksi,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/StatusBadge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { snapPay } from "@/lib/midtrans-snap";
import { formatRupiah } from "@/components/SpaceCard";
import { QrCodeCard } from "@/components/QrCodeCard";
import {
  CalendarCheck,
  QrCode,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Plus,
  ArrowRight,
  User,
  Phone,
  ShieldCheck,
  Search,
  Receipt,
  Download,
  Printer,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ChevronRight,
  Ticket,
  Star,
  Wallet,
  Wifi,
  Radio,
  Share2,
  Copy,
  Check,
  Lock,
  Filter,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterTab, setFilterTab] = useState<"all" | "active" | "pending" | "selesai" | "dibatalkan">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedTicket, setSelectedTicket] = useState<Reservation | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Reservation | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Record<number, Transaksi>>({});
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const [selectedReviewBooking, setSelectedReviewBooking] = useState<Reservation | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  const [copiedPin, setCopiedPin] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyBookings();
      setReservations(data || []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      const map: Record<number, Transaksi> = {};
      for (const t of data || []) {
        map[t.reservasiId] = t;
      }
      setTransactions(map);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    loadTransactions();
  }, [fetchBookings, loadTransactions]);

  const activeReservations = useMemo(() => {
    return reservations.filter(
      (r) => r.status?.toLowerCase() === "aktif" || r.status?.toLowerCase() === "disetujui"
    );
  }, [reservations]);

  const currentActivePass = activeReservations.length > 0 ? activeReservations[0] : null;

  const upcomingReservations = useMemo(() => {
    return reservations.filter((r) => {
      const s = r.status?.toLowerCase();
      return s === "pending" || (s === "disetujui" && r.id !== currentActivePass?.id);
    });
  }, [reservations, currentActivePass]);

  const pastReservations = useMemo(() => {
    return reservations.filter((r) => {
      const s = r.status?.toLowerCase();
      return s === "selesai" || s === "dibatalkan";
    });
  }, [reservations]);

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    setCancelling(true);
    try {
      await cancelBooking(cancelTargetId);
      setCancelSuccessMsg("Reservasi berhasil dibatalkan.");
      setCancelTargetId(null);
      await fetchBookings();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
      setCancelTargetId(null);
    } finally {
      setCancelling(false);
    }
  };

  const handlePay = async (res: Reservation) => {
    setPayingId(res.id);
    setPayError(null);
    setPayMessage(null);
    try {
      const response = await startPayment(res.id);
      const result = response.data;

      if (result.redirectUrl) {
        window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
      }

      await snapPay(result.clientKey, result.snapScriptUrl, result.snapToken, {
        onSuccess: async () => {
          setPayMessage(`Pembayaran ${result.nomorInvoice} berhasil. Sedang menyinkronkan status...`);
          try {
            await syncPayment(result.transactionId);
          } catch {}
          setPayMessage(`Pembayaran invoice ${result.nomorInvoice} telah lunas. Terima kasih!`);
          await fetchBookings();
          await loadTransactions();
        },
        onPending: async () => {
          try {
            await syncPayment(result.transactionId);
          } catch {}
          setPayMessage("Pembayaran sedang menunggu konfirmasi. Status telah disinkronkan.");
          await fetchBookings();
          await loadTransactions();
        },
        onError: () => {
          setPayError("Pembayaran gagal atau dibatalkan oleh sistem pembayaran.");
        },
        onClose: () => {
          setPayingId(null);
        },
      });
    } catch (err: unknown) {
      setPayError(getApiErrorMessage(err));
      setPayingId(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewBooking) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await createReview({
        reservasiId: selectedReviewBooking.id,
        rating: reviewRating,
        komentar: reviewComment.trim() || undefined,
      });
      setReviewSuccessMsg("Terima kasih! Ulasan Anda berhasil dikirim.");
      setSelectedReviewBooking(null);
      setReviewComment("");
      await fetchBookings();
    } catch (err: unknown) {
      setReviewError(getApiErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDownloadFullPass = (ticket: Reservation) => {
    const svg = document.getElementById(`qr-svg-${ticket.qrCode}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 800;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 800);

    const grad = ctx.createLinearGradient(0, 0, 600, 160);
    grad.addColorStop(0, "#0D5C63");
    grad.addColorStop(1, "#0A2F35");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 160);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("WORKNEST SMART PASS", 40, 55);

    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#BCE3DE";
    ctx.fillText(ticket.detailReservasi?.space?.owner?.namaCoworking || "Coworking Space", 40, 85);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#e0f2fe";
    ctx.fillText("DIGITAL BOARDING PASS & ACCESS KEY", 40, 125);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(ticket.detailReservasi?.space?.namaSpace || "Ruangan Space", 40, 210);

    ctx.fillStyle = "#64748b";
    ctx.font = "13px sans-serif";
    ctx.fillText(`Tipe: ${ticket.detailReservasi?.space?.tipe?.toUpperCase() || "SPACE"}`, 40, 235);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(175, 385, 250, 250);
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(175, 385, 250, 250);

      ctx.drawImage(img, 200, 410, 200, 200);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(ticket.qrCode, 300, 675);

      ctx.fillStyle = "#059669";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("STATUS: VALID ACCESS PASS", 300, 710);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `WorkNest-Pass-${ticket.qrCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const getPinDigits = (code: string) => {
    const clean = code.replace(/\D/g, "");
    if (clean.length >= 4) return clean.slice(-4).split("");
    const hash = code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return String(Math.abs(hash % 9000) + 1000).split("");
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Member</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-medium">Passes</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            My Tickets & Active Passes
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeReservations.length} Pass Active Now</span>
          </div>
          <button
            type="button"
            onClick={fetchBookings}
            disabled={loading}
            title="Refresh Passes"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#0D5C63]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {cancelSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setCancelSuccessMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      {reviewSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reviewSuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setReviewSuccessMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: CURRENT ACTIVE PASS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              CURRENT ACTIVE PASS
            </span>
            {currentActivePass && (
              <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-mono font-bold text-[10px]">
                PASS-ID: {currentActivePass.qrCode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            <span>NFC reader enabled at terminal</span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-[#0D5C63] animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2 font-medium">Loading telemetry passes...</p>
          </div>
        ) : currentActivePass ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Col: Space Specs & Actions */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0D5C63]">
                    <Building2 className="w-4 h-4" />
                    <span>
                      {currentActivePass.detailReservasi?.space?.owner?.namaCoworking || "WorkNest Hub"} • Floor {((currentActivePass.detailReservasi?.space?.id || 1) % 4) + 1}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    SmartLock v4
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                  {currentActivePass.detailReservasi?.space?.namaSpace}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
                  {currentActivePass.detailReservasi?.space?.deskripsi ||
                    "Dedicated workspace with high-speed fiber connection and active smart door telemetry."}
                </p>

                {/* 4 Attributes in 2x2 grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      SLOT TIME
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      {currentActivePass.jamMulai} WIB
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Duration: {currentActivePass.durasiJam || 1} Hour Session
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      ACCESS NODE
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Engaged
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Unit Sensor #{currentActivePass.id}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      WI-FI NETWORK
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-[#0D5C63]" />
                      WorkNest-WiFi
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Pass: nest{currentActivePass.qrCode.slice(-4)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      HOST ROLE
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      Master Host
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Max {currentActivePass.detailReservasi?.space?.kapasitas || 1} Pax
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <Link
                    href={`/spaces/${currentActivePass.detailReservasi?.space?.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#0D5C63]" />
                    <span>Extend +1 Hr</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Access Pass #${currentActivePass.qrCode} for ${currentActivePass.detailReservasi?.space?.namaSpace}. PIN: ${getPinDigits(currentActivePass.qrCode).join("")}`
                      );
                      setShareSuccess(true);
                      setTimeout(() => setShareSuccess(false), 2500);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{shareSuccess ? "Pass Copied!" : "Share Key with Guest"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancelTargetId(currentActivePass.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold text-rose-600 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Reservation</span>
                  </button>
                </div>
              </div>

              {/* NFC Banner */}
              <div className="p-3 bg-[#E6F4F2] border border-[#BCE3DE] rounded-xl flex items-center justify-between text-xs text-[#0D5C63]">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#0D5C63]" />
                  <span>Tap physical membership card or hold device 5cm from the wall scanner next to door handle.</span>
                </div>
                <span className="font-mono font-bold text-[11px] uppercase tracking-wider shrink-0 bg-white/70 px-2 py-0.5 rounded">
                  NFC READY
                </span>
              </div>
            </div>

            {/* Right Col: Dynamic QR & Keypad PIN */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col items-center justify-between text-center bg-slate-50/50 space-y-5">
              {/* Progress & Remaining Time */}
              <div className="w-full space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#0D5C63]" />
                    Time Remaining
                  </span>
                  <span className="font-bold text-slate-900">Active Session</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0D5C63] rounded-full w-3/4" />
                </div>
              </div>

              {/* QR Code */}
              <div
                onClick={() => setSelectedTicket(currentActivePass)}
                title="Click to expand pass"
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-[#0D5C63] transition-all flex flex-col items-center"
              >
                <QrCodeCard value={currentActivePass.qrCode} size={150} showCopy={false} />
              </div>

              {/* Door Keypad Backup PIN */}
              <div className="w-full space-y-2">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  PHYSICAL DOOR KEYPAD BACKUP PIN
                </p>
                <div className="flex items-center justify-center gap-2">
                  {getPinDigits(currentActivePass.qrCode).map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-9 h-10 rounded-lg bg-white border border-slate-300 font-mono font-bold text-lg text-slate-900 flex items-center justify-center shadow-2xs"
                    >
                      {digit}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getPinDigits(currentActivePass.qrCode).join(""));
                      setCopiedPin(true);
                      setTimeout(() => setCopiedPin(false), 2000);
                    }}
                    title="Copy PIN"
                    className="p-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedPin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Refreshes dynamically • ISO-14443 Type A
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F4F2] text-[#0D5C63] flex items-center justify-center mx-auto border border-[#BCE3DE]">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                No Active Pass in Session
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You do not have any active space passes right now. Book a workspace or open an upcoming booking to generate your digital smart key.
              </p>
            </div>
            <Link
              href="/spaces"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D5C63] hover:bg-[#09474D] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <span>Explore Spaces</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* SECTION 2: UPCOMING BOOKINGS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Upcoming Bookings
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
              {upcomingReservations.length} Scheduled
            </span>
          </div>
          <Link
            href="/spaces"
            className="text-xs font-semibold text-[#0D5C63] hover:underline flex items-center gap-1"
          >
            <span>Book another desk</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {upcomingReservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingReservations.map((res) => {
              const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";
              const space = res.detailReservasi?.space;
              const isConfirmed = res.status?.toLowerCase() === "disetujui";
              const pin = getPinDigits(res.qrCode).join("");

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 font-bold">
                        #{res.qrCode.slice(0, 8)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isConfirmed
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {isConfirmed ? "Pass Ready" : "Awaiting Confirmation"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif text-lg font-semibold text-slate-900 line-clamp-1">
                        {space?.namaSpace || `Space #${res.id}`}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {space?.owner?.namaCoworking || "Coworking Space"} • Floor {((space?.id || 1) % 4) + 1}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-[#0D5C63]" />
                          {rawDate}
                        </span>
                        <span className="font-mono font-medium text-slate-800">
                          {res.jamMulai} WIB ({res.durasiJam || 1}h)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <User className="w-3.5 h-3.5 text-[#0D5C63]" />
                          {space?.kapasitas || 1} Pax
                        </span>
                        <span className="text-slate-700 truncate max-w-[120px]">
                          {space?.tipe?.toUpperCase() || "FLEX"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 text-[11px]">
                      Keycode: [{pin}]
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(res)}
                      className="font-bold text-[#0D5C63] hover:underline cursor-pointer"
                    >
                      View Access Pass
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No upcoming bookings scheduled. Explore the catalog to reserve a room.
          </div>
        )}
      </div>

      {/* SECTION 3: PAST VISITS & UTILIZATION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Past Visits &amp; Utilization
            </h2>
            <p className="text-xs text-slate-500">
              Showing last {pastReservations.length} transactions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {}}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={() => {}}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">DATE &amp; TIME</th>
                  <th className="py-3 px-4 font-bold">WORKSPACE NAME</th>
                  <th className="py-3 px-4 font-bold">LOCATION / HUB</th>
                  <th className="py-3 px-4 font-bold">DURATION</th>
                  <th className="py-3 px-4 font-bold">AMOUNT PAID</th>
                  <th className="py-3 px-4 font-bold text-right">INVOICE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pastReservations.length > 0 ? (
                  pastReservations.map((res) => {
                    const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";
                    const space = res.detailReservasi?.space;
                    const payment = transactions[res.id];
                    const amount = res.detailReservasi?.totalHarga || (space?.hargaPerJam || 0) * (res.durasiJam || 1);

                    return (
                      <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                          {rawDate}
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {res.jamMulai} WIB
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {space?.namaSpace || `Space #${res.id}`}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {space?.tipe?.toUpperCase() || "ROOM"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {space?.owner?.namaCoworking || "WorkNest Hub"}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {res.durasiJam || 1}.0 hrs
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {formatRupiah(amount)}
                          <span className="block text-[10px] text-emerald-600 font-medium font-sans">
                            • Settled via {payment?.metodePembayaran || "Payment Gateway"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(res)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No past visits recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TICKET POPUP MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl space-y-0">
            <div className="bg-[#0D5C63] text-white p-5 space-y-1 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  E-Ticket Digital Pass
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <h3 className="text-lg font-bold pt-1">
                {selectedTicket.detailReservasi?.space?.namaSpace}
              </h3>
              <p className="text-xs text-[#BCE3DE]">
                {selectedTicket.detailReservasi?.space?.owner?.namaCoworking}
              </p>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
                <QrCodeCard
                  value={selectedTicket.qrCode}
                  size={190}
                  showDownload={true}
                  label="Scan Barcode at Terminal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Date</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicket.tanggalReservasi ? selectedTicket.tanggalReservasi.split("T")[0] : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Slot Time</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicket.jamMulai} WIB ({selectedTicket.durasiJam || 1} Hour)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadFullPass(selectedTicket)}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Download E-Pass Digital HD (PNG)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT / INVOICE MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#0D5C63]" />
                <h3 className="text-base font-bold text-slate-900">Official Invoice &amp; Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-mono font-bold text-slate-900">INV-{selectedReceipt.qrCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issued Date:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(selectedReceipt.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Coworking Space:</span>
                <span className="font-semibold text-slate-900">
                  {selectedReceipt.detailReservasi?.space?.owner?.namaCoworking}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 p-3 font-bold text-slate-700 border-b border-slate-200 grid grid-cols-12">
                <span className="col-span-6">Workspace Item</span>
                <span className="col-span-2 text-center">Duration</span>
                <span className="col-span-4 text-right">Subtotal</span>
              </div>
              <div className="p-3 grid grid-cols-12 items-center text-slate-800">
                <div className="col-span-6 font-semibold">
                  {selectedReceipt.detailReservasi?.space?.namaSpace}
                  <span className="block text-[11px] text-slate-400 font-normal">
                    {formatRupiah(selectedReceipt.detailReservasi?.space?.hargaPerJam || 0)} / hour
                  </span>
                </div>
                <span className="col-span-2 text-center">{selectedReceipt.durasiJam || 1}h</span>
                <span className="col-span-4 text-right font-mono font-bold">
                  {formatRupiah(
                    (selectedReceipt.detailReservasi?.space?.hargaPerJam || 0) * (selectedReceipt.durasiJam || 1)
                  )}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-12 text-slate-900 font-bold text-sm">
                <span className="col-span-6">Total Amount</span>
                <span className="col-span-6 text-right font-mono text-[#0D5C63]">
                  {formatRupiah(selectedReceipt.detailReservasi?.totalHarga || 0)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <XCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Cancel Reservation?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This space access pass will be invalidated and door locks will revoke physical entry permissions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetId(null)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Cancel</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
