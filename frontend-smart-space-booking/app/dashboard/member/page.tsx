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
  Receipt,
  Download,
  Printer,
  Radio,
  Share2,
  Copy,
  Check,
  FileText,
} from "lucide-react";

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTicket, setSelectedTicket] = useState<Reservation | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Reservation | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Record<number, Transaksi>>({});

  const [copiedPin, setCopiedPin] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const fetchBookings = useCallback(async (autoSync = true) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyBookings();
      const list = Array.isArray(data) ? data : [];
      setReservations(list);

      // Auto-sync in background if there are pending bookings/transactions
      if (autoSync && list.length > 0) {
        const pendingItems = list.filter(
          (r) =>
            r.status?.toLowerCase() === "pending" ||
            (r.transaksi && r.transaksi.statusPembayaran !== "lunas")
        );

        if (pendingItems.length > 0) {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token") || localStorage.getItem("access_token")
              : null;

          Promise.all(
            pendingItems.map(async (r) => {
              try {
                const orderId =
                  r.transaksi?.midtransOrderId ||
                  r.transaksi?.nomorInvoice ||
                  `INV-RES-${r.id}`;

                if (orderId) {
                  const checkRes = await fetch(
                    `/api/charge/status?orderId=${encodeURIComponent(orderId)}&transactionId=${r.transaksi?.id || r.id}&reservationId=${r.id}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                  );
                  const statusData = await checkRes.json();
                  if (statusData.isPaid) return true;
                }

                const syncId = r.transaksi?.id || r.id;
                if (syncId) {
                  const syncRes = await syncPayment(syncId);
                  const updated = syncRes?.data || syncRes;
                  if (updated?.statusPembayaran === "lunas" || updated?.status === "disetujui") {
                    return true;
                  }
                }
              } catch {}
              return false;
            })
          ).then((results) => {
            if (results.some(Boolean)) {
              getMyBookings()
                .then((refreshed) => {
                  if (Array.isArray(refreshed)) setReservations(refreshed);
                })
                .catch(() => {});
            }
          });
        }
      }
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
    } catch {}
  }, []);

  useEffect(() => {
    fetchBookings(true);
    loadTransactions();
  }, [fetchBookings, loadTransactions]);

  const activeReservations = useMemo(() => {
    return reservations.filter((r) => {
      const isPaid =
        r.transaksi?.statusPembayaran === "lunas" ||
        transactions[r.id]?.statusPembayaran === "lunas";
      const s = r.status?.toLowerCase();
      if (s === "selesai" || s === "dibatalkan") return false;
      return s === "aktif" || s === "disetujui" || isPaid;
    });
  }, [reservations, transactions]);

  const currentActivePass = activeReservations.length > 0 ? activeReservations[0] : null;

  const upcomingReservations = useMemo(() => {
    return reservations.filter((r) => {
      const s = r.status?.toLowerCase();
      if (s === "selesai" || s === "dibatalkan") return false;
      return (
        (s === "pending" || s === "disetujui" || s === "aktif") &&
        r.id !== currentActivePass?.id
      );
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
      await fetchBookings(false);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
      setCancelTargetId(null);
    } finally {
      setCancelling(false);
    }
  };

  const getPinDigits = (code: string) => {
    const clean = code.replace(/\D/g, "");
    if (clean.length >= 4) return clean.slice(-4).split("");
    const hash = code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return String(Math.abs(hash % 9000) + 1000).split("");
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
    grad.addColorStop(0, "#006370");
    grad.addColorStop(1, "#004f59");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 160);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("WORKNEST ACCESS PASS", 40, 55);

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

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>PORTAL MEMBER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Tiket Digital &amp; Akses Ruangan
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Tiket Saya &amp; Akses Aktif
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Akses QR code tiket masuk digital, PIN keypad pintu fisik, dan kelola seluruh reservasi ruang kerja Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeReservations.length} Akses Aktif</span>
          </div>
          <button
            type="button"
            onClick={() => fetchBookings(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#006370]" : ""}`} />
            <span>Perbarui</span>
          </button>
          <Link
            href="/dashboard/member/spaces"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pesan Ruangan</span>
          </Link>
        </div>
      </div>

      {cancelSuccessMsg && (
        <div className="p-4 rounded-xs bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setCancelSuccessMsg(null)} className="font-bold cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xs bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              AKSES AKTIF SAAT INI
            </span>
            {currentActivePass && (
              <span className="px-2 py-0.5 rounded-xs bg-[#E6F4F2] text-[#006370] font-mono font-bold text-[10px] border border-[#BCE3DE]">
                ID TIKET: {currentActivePass.qrCode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Check-in QR &amp; PIN aktif di terminal</span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center bg-white rounded-xs border border-slate-200 shadow-2xs">
            <Loader2 className="w-8 h-8 text-[#006370] animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2 font-medium">Memuat tiket &amp; akses aktif...</p>
          </div>
        ) : currentActivePass ? (
          <div className="bg-white rounded-xs border border-slate-200 shadow-2xs overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#006370]">
                    <Building2 className="w-4 h-4" />
                    <span>
                      {currentActivePass.detailReservasi?.space?.owner?.namaCoworking || "WorkNest Hub"}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Tiket Aktif
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                  {currentActivePass.detailReservasi?.space?.namaSpace}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
                  {currentActivePass.detailReservasi?.space?.deskripsi ||
                    "Ruang kerja terdedikasi dengan koneksi internet berkecepatan tinggi dan akses pintu otomatis."}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xs border border-slate-200/80 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      WAKTU SESI
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                      {currentActivePass.jamMulai} WIB
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Durasi: {currentActivePass.durasiJam || 1} Jam
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xs border border-slate-200/80 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      STATUS CHECK-IN
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      QR Siap Digunakan
                    </p>
                    <p className="text-[10px] text-slate-500">
                      ID Reservasi #{currentActivePass.id}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xs border border-slate-200/80 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      KODE TIKET
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-[#006370] font-mono">
                      {currentActivePass.qrCode}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Tunjukkan di frontdesk
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xs border border-slate-200/80 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      KAPASITAS
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      {currentActivePass.detailReservasi?.space?.kapasitas || 1} Kursi
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-mono">
                      {currentActivePass.detailReservasi?.space?.tipe || "ROOM"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Tiket Akses #${currentActivePass.qrCode} untuk ${currentActivePass.detailReservasi?.space?.namaSpace}. PIN: ${getPinDigits(currentActivePass.qrCode).join("")}`
                      );
                      setShareSuccess(true);
                      setTimeout(() => setShareSuccess(false), 2500);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xs text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{shareSuccess ? "Kunci Berhasil Disalin!" : "Bagikan Kunci Akses"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancelTargetId(currentActivePass.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xs text-xs font-semibold text-rose-600 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Batalkan Reservasi</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#E6F4F2]/50 border border-[#BCE3DE] rounded-xs flex items-center justify-between text-xs text-[#006370]">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#006370]" />
                  <span>Tunjukkan QR Code di samping kepada resepsionis saat tiba di lokasi untuk konfirmasi kedatangan.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col items-center justify-between text-center bg-slate-50/50 space-y-5">
              <div
                onClick={() => setSelectedTicket(currentActivePass)}
                title="Klik untuk memperbesar tiket"
                className="p-4 bg-white rounded-xs border border-slate-200 shadow-2xs cursor-pointer hover:border-[#006370] transition-all flex flex-col items-center"
              >
                <QrCodeCard value={currentActivePass.qrCode} size={150} showCopy={false} />
              </div>

              <div className="w-full space-y-2">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  PIN CADANGAN KEYPAD PINTU FISIK
                </p>
                <div className="flex items-center justify-center gap-2">
                  {getPinDigits(currentActivePass.qrCode).map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-9 h-10 rounded-xs bg-white border border-slate-300 font-mono font-bold text-lg text-slate-900 flex items-center justify-center shadow-2xs"
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
                    title="Salin PIN"
                    className="p-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedPin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center bg-white rounded-xs border border-slate-200 space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center mx-auto border border-[#BCE3DE]">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Tidak Ada Akses Aktif Saat Ini
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda belum memiliki tiket akses yang aktif. Pesan ruangan baru untuk mendapatkan kunci digital &amp; PIN Anda.
              </p>
            </div>
            <Link
              href="/dashboard/member/spaces"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors"
            >
              <span>Jelajahi Ruangan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Reservasi Mendatang
            </h2>
            <p className="text-xs text-slate-500">
              Jadwal pemesanan ruang kerja yang siap digunakan
            </p>
          </div>
          <Link
            href="/dashboard/member/spaces"
            className="text-xs font-semibold text-[#006370] hover:underline flex items-center gap-1"
          >
            <span>Pesan ruangan lain</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingReservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingReservations.map((res) => {
              const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";
              const space = res.detailReservasi?.space;
              const isConfirmed =
                res.status?.toLowerCase() === "disetujui" ||
                res.status?.toLowerCase() === "aktif" ||
                res.transaksi?.statusPembayaran === "lunas" ||
                transactions[res.id]?.statusPembayaran === "lunas";
              const pin = getPinDigits(res.qrCode).join("");

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-xs border border-slate-200 p-5 space-y-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 font-bold">
                        #{res.qrCode.slice(0, 8)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                          isConfirmed
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {isConfirmed ? "Tiket Siap" : "Menunggu Konfirmasi"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif text-base font-bold text-slate-900 line-clamp-1">
                        {space?.namaSpace || `Ruangan #${res.id}`}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {space?.owner?.namaCoworking || "Coworking Space"}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-[#006370]" />
                          {rawDate}
                        </span>
                        <span className="font-mono font-medium text-slate-800">
                          {res.jamMulai} WIB ({res.durasiJam || 1} Jam)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <User className="w-3.5 h-3.5 text-[#006370]" />
                          {space?.kapasitas || 1} Orang
                        </span>
                        <span className="text-slate-700 truncate max-w-[120px] uppercase font-mono text-[11px]">
                          {space?.tipe || "FLEX"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 text-[11px]">
                      PIN: [{pin}]
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(res)}
                      className="font-bold text-[#006370] hover:underline cursor-pointer"
                    >
                      Lihat Tiket
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-white rounded-xs border border-slate-200 text-xs text-slate-500 shadow-2xs">
            Belum ada jadwal reservasi mendatang. Buka katalog untuk memesan ruangan.
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Riwayat Kunjungan &amp; Penggunaan
          </h2>
          <p className="text-xs text-slate-500">
            Daftar seluruh sesi reservasi yang telah selesai atau dibatalkan
          </p>
        </div>

        <div className="bg-white rounded-xs border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">TANGGAL &amp; WAKTU</th>
                  <th className="py-3 px-4 font-bold">NAMA RUANGAN</th>
                  <th className="py-3 px-4 font-bold">LOKASI / HUB</th>
                  <th className="py-3 px-4 font-bold">DURASI</th>
                  <th className="py-3 px-4 font-bold">TOTAL DIBAYAR</th>
                  <th className="py-3 px-4 font-bold text-right">FAKTUR</th>
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
                          {space?.namaSpace || `Ruangan #${res.id}`}
                          <span className="block text-[10px] text-slate-400 font-normal uppercase font-mono">
                            {space?.tipe || "ROOM"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {space?.owner?.namaCoworking || "WorkNest Hub"}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {res.durasiJam || 1} Jam
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {formatRupiah(amount)}
                          <span className="block text-[10px] text-emerald-600 font-medium font-sans">
                            • Lunas
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(res)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
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
                      Belum ada riwayat kunjungan yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xs max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl space-y-0 animate-in fade-in zoom-in-95">
            <div className="bg-[#006370] text-white p-5 space-y-1 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-xs">
                  Tiket Masuk Digital
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 text-white hover:bg-white/20 rounded-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <h3 className="text-base font-bold pt-1">
                {selectedTicket.detailReservasi?.space?.namaSpace}
              </h3>
              <p className="text-xs text-[#BCE3DE]">
                {selectedTicket.detailReservasi?.space?.owner?.namaCoworking}
              </p>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="p-4 bg-slate-50 rounded-xs border border-slate-200 inline-block">
                <QrCodeCard
                  value={selectedTicket.qrCode}
                  size={180}
                  showDownload={true}
                  label="Pindai Barcode di Terminal Pintu"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left bg-slate-50 p-4 rounded-xs border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Tanggal</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicket.tanggalReservasi ? selectedTicket.tanggalReservasi.split("T")[0] : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Waktu Sesi</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicket.jamMulai} WIB ({selectedTicket.durasiJam || 1} Jam)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadFullPass(selectedTicket)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xs shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#BCE3DE]" />
                <span>Unduh E-Pass Digital HD (PNG)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xs max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#006370]" />
                <h3 className="font-serif text-base font-bold text-slate-900">Faktur &amp; Bukti Pembayaran Resmi</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xs border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Faktur:</span>
                <span className="font-mono font-bold text-slate-900">INV-{selectedReceipt.qrCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Terbit:</span>
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

            <div className="border border-slate-200 rounded-xs overflow-hidden text-xs">
              <div className="bg-slate-50 p-3 font-bold text-slate-700 border-b border-slate-200 grid grid-cols-12">
                <span className="col-span-6">Item Ruangan</span>
                <span className="col-span-2 text-center">Durasi</span>
                <span className="col-span-4 text-right">Subtotal</span>
              </div>
              <div className="p-3 grid grid-cols-12 items-center text-slate-800">
                <div className="col-span-6 font-semibold">
                  {selectedReceipt.detailReservasi?.space?.namaSpace}
                  <span className="block text-[11px] text-slate-400 font-normal">
                    {formatRupiah(selectedReceipt.detailReservasi?.space?.hargaPerJam || 0)} / jam
                  </span>
                </div>
                <span className="col-span-2 text-center">{selectedReceipt.durasiJam || 1} Jam</span>
                <span className="col-span-4 text-right font-mono font-bold">
                  {formatRupiah(
                    (selectedReceipt.detailReservasi?.space?.hargaPerJam || 0) * (selectedReceipt.durasiJam || 1)
                  )}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-12 text-slate-900 font-bold text-sm">
                <span className="col-span-6">Total Pembayaran</span>
                <span className="col-span-6 text-right font-mono text-[#006370]">
                  {formatRupiah(selectedReceipt.detailReservasi?.totalHarga || 0)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-4 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Faktur</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xs max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xs bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base font-bold text-slate-900">Batalkan Reservasi?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tiket akses ruangan ini akan dinonaktifkan dan hak akses pintu fisik akan dicabut otomatis.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCancelTargetId(null)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xs transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Ya, Batalkan</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
