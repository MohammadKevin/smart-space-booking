"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getMyBookings,
  cancelBooking,
  getTransactions,
  startPayment,
  syncPayment,
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
  Wallet,
} from "lucide-react";

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search States
  const [filterTab, setFilterTab] = useState<"all" | "active" | "pending" | "selesai" | "dibatalkan">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals State
  const [selectedTicket, setSelectedTicket] = useState<Reservation | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Reservation | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Payment (Midtrans) State
  const [transactions, setTransactions] = useState<Record<number, Transaksi>>({});
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

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
      // Non-blocking: payment buttons simply won't render without tx data.
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    loadTransactions();
  }, [fetchBookings, loadTransactions]);

  // Derived KPI Stats
  const activeCount = reservations.filter((r) => r.status?.toLowerCase() === "aktif" || r.status?.toLowerCase() === "disetujui").length;
  const pendingCount = reservations.filter((r) => r.status?.toLowerCase() === "pending").length;
  const completedCount = reservations.filter((r) => r.status?.toLowerCase() === "selesai").length;
  const totalHours = reservations.reduce((acc, curr) => acc + (curr.durasiJam || 1), 0);

  // Filtered List
  const filteredReservations = reservations.filter((r) => {
    const status = r.status?.toLowerCase() || "";
    const spaceName = r.detailReservasi?.space?.namaSpace?.toLowerCase() || "";
    const coworkingName = r.detailReservasi?.space?.owner?.namaCoworking?.toLowerCase() || "";
    const code = r.qrCode?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();

    const matchesSearch = !q || spaceName.includes(q) || coworkingName.includes(q) || code.includes(q);

    if (!matchesSearch) return false;

    if (filterTab === "active") return status === "aktif" || status === "disetujui";
    if (filterTab === "pending") return status === "pending";
    if (filterTab === "selesai") return status === "selesai";
    if (filterTab === "dibatalkan") return status === "dibatalkan";
    return true;
  });

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
      await snapPay(result.clientKey, result.snapScriptUrl, result.snapToken, {
        onSuccess: async () => {
          setPayMessage(`Pembayaran ${result.nomorInvoice} berhasil. Status sedang diperbarui...`);
          try {
            const tx = await getTransactions();
            const map: Record<number, Transaksi> = {};
            for (const t of tx) map[t.reservasiId] = t;
            setTransactions(map);
          } catch {
            // silently ignore reconcile failure; webhook will finalize status
          }
          setPayMessage(`Pembayaran invoice ${result.nomorInvoice} telah lunas. Terima kasih!`);
          await fetchBookings();
          await loadTransactions();
        },
        onPending: async () => {
          setPayMessage("Pembayaran sedang menunggu konfirmasi. Status akan diperbarui otomatis via notifikasi.");
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

  const getWhatsAppLink = (res: Reservation) => {
    const ownerTelp = res.detailReservasi?.space?.owner?.telp || "";
    const cleanPhone = ownerTelp.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const text = encodeURIComponent(
      `Halo pengelola ${res.detailReservasi?.space?.owner?.namaCoworking || "Coworking Space"}, saya member ${user?.username} ingin menanyakan info reservasi tiket #${res.qrCode} untuk ruangan ${res.detailReservasi?.space?.namaSpace}.`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <CalendarCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Portal Digital Member</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Tiket Digital & Riwayat Reservasi
          </h1>
          <p className="text-xs text-slate-500">
            Tunjukkan kode QR tiket digital di layar HP kepada resepsionis saat tiba di lokasi untuk check-in instan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchBookings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Sewa Ruangan Baru</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tiket Siap Pakai</p>
            <p className="text-xl font-bold text-slate-900">{activeCount} Tiket</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Menunggu Konfirmasi</p>
            <p className="text-xl font-bold text-slate-900">{pendingCount} Booking</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Selesai Dipakai</p>
            <p className="text-xl font-bold text-slate-900">{completedCount} Sesi</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Total Jam Sewa</p>
            <p className="text-xl font-bold text-slate-900">{totalHours} Jam</p>
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {cancelSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs shadow-xs animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setCancelSuccessMsg(null)}
            className="font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {payMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-between text-cyan-800 text-xs shadow-xs">
          <span className="font-medium">{payMessage}</span>
          <button
            type="button"
            onClick={() => setPayMessage(null)}
            className="font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {payError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs shadow-xs">
          <span className="font-medium">{payError}</span>
          <button
            type="button"
            onClick={() => setPayError(null)}
            className="font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `Semua (${reservations.length})` },
            { id: "active", label: `Aktif & Disetujui (${activeCount})` },
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "selesai", label: `Selesai (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTab === tab.id
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ruangan / kode tiket..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-600 rounded-lg text-xs text-slate-800 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Main Reservation Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
            <Loader2 className="w-7 h-7 text-cyan-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2 font-medium">Memuat tiket & riwayat reservasi...</p>
          </div>
        ) : filteredReservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredReservations.map((res) => {
              const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";
              const spaceName = res.detailReservasi?.space?.namaSpace || `Space #${res.id}`;
              const coworkingName = res.detailReservasi?.space?.owner?.namaCoworking || "Coworking Space";
              const spacePhoto = res.detailReservasi?.space?.foto;
              const totalCost = res.detailReservasi?.totalHarga || 0;
              const payment = transactions[res.id];
              const canPay =
                res.status?.toLowerCase() === "disetujui" &&
                (!payment || payment.statusPembayaran !== "lunas") &&
                payment?.statusPembayaran !== "refund";
              const canCancel = res.status?.toLowerCase() === "pending" || res.status?.toLowerCase() === "disetujui";
              const isReadyForScan = res.status?.toLowerCase() === "disetujui" || res.status?.toLowerCase() === "aktif";

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Top Bar with Coworking & Status */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{coworkingName}</span>
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-1">
                          {spaceName}
                        </h3>
                      </div>
                      <StatusBadge status={res.status} />
                    </div>

                    {/* Middle Section: QR Code & Booking Specs */}
                    <div className="grid grid-cols-12 gap-3.5 items-center">
                      {/* Visual QR Code Display */}
                      <div className="col-span-4 flex flex-col items-center">
                        <div
                          onClick={() => setSelectedTicket(res)}
                          title="Klik untuk memperbesar QR"
                          className="cursor-pointer group p-2 bg-slate-50 hover:bg-cyan-50/50 rounded-xl border border-slate-200 transition-all text-center flex flex-col items-center"
                        >
                          <QrCodeCard value={res.qrCode} size={90} showCopy={false} />
                          <span className="text-[10px] font-bold text-cyan-700 group-hover:underline mt-1">
                            Perbesar QR
                          </span>
                        </div>
                      </div>

                      {/* Specs & Pricing */}
                      <div className="col-span-8 space-y-2 text-xs text-slate-600 pl-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">{rawDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{res.jamMulai} WIB ({res.durasiJam || 1} Jam Sesi)</span>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                          <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Biaya:</span>
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {formatRupiah(totalCost)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          {payment ? (
                            <>
                              <PaymentStatusBadge status={payment.statusPembayaran} />
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[9rem]">
                                {payment.nomorInvoice}
                              </span>
                            </>
                          ) : (
                            <PaymentStatusBadge status="belum_bayar" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(res)}
                        className="px-2.5 py-1.5 bg-white hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-cyan-600" />
                        <span>E-Tiket</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(res)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>Invoice</span>
                      </button>

                      {res.detailReservasi?.space?.owner?.telp && (
                        <a
                          href={getWhatsAppLink(res)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canPay && (
                        <button
                          type="button"
                          disabled={payingId === res.id}
                          onClick={() => handlePay(res)}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {payingId === res.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Wallet className="w-3.5 h-3.5" />
                          )}
                          <span>{payingId === res.id ? "Memproses..." : "Bayar"}</span>
                        </button>
                      )}

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setCancelTargetId(res.id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <QrCode className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Tidak Ada Data Reservasi
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? "Tidak ada pemesanan yang cocok dengan kata kunci pencarian Anda."
                  : "Anda belum memiliki riwayat reservasi pada kategori ini. Silakan pesan ruangan baru di katalog."}
              </p>
            </div>
            <Link
              href="/spaces"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <span>Jelajahi Katalog Ruangan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Modal 1: Full E-Ticket Digital Pass */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl space-y-0">
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-sky-700 text-white p-5 space-y-1 relative">
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
              <p className="text-xs text-cyan-100 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{selectedTicket.detailReservasi?.space?.owner?.namaCoworking}</span>
              </p>
            </div>

            {/* Ticket Body: Big High Contrast QR Code */}
            <div className="p-6 space-y-5 text-center">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block shadow-inner">
                <QrCodeCard
                  value={selectedTicket.qrCode}
                  size={190}
                  showDownload={true}
                  label="Scan Barcode di Resepsionis"
                />
              </div>

              {/* Booking Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal Reservasi</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicket.tanggalReservasi ? selectedTicket.tanggalReservasi.split("T")[0] : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Jam Mulai & Durasi</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicket.jamMulai} WIB ({selectedTicket.durasiJam || 1} Jam)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Pemesan</span>
                  <span className="font-bold text-slate-900">{user?.username}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Status Tiket</span>
                  <div className="pt-0.5">
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tunjukkan layar ini kepada staf resepsionis untuk dipindai kamera check-in.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: E-Receipt / Official Invoice */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-900">Bukti Pembayaran & Invoice</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Invoice:</span>
                <span className="font-mono font-bold text-slate-900">INV-{selectedReceipt.qrCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Transaksi:</span>
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

            {/* Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
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

              {selectedReceipt.detailReservasi?.diskon && (
                <div className="p-3 bg-emerald-50/50 border-t border-slate-100 grid grid-cols-12 text-emerald-800 text-xs font-semibold">
                  <span className="col-span-8">
                    Voucher Promo: {selectedReceipt.detailReservasi.diskon.namaDiskon} ({selectedReceipt.detailReservasi.diskon.persentaseDiskon}%)
                  </span>
                  <span className="col-span-4 text-right font-mono">
                    - Potongan Kupon
                  </span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-12 text-slate-900 font-bold text-sm">
                <span className="col-span-6">Total Pembayaran</span>
                <span className="col-span-6 text-right font-mono text-cyan-700">
                  {formatRupiah(selectedReceipt.detailReservasi?.totalHarga || 0)}
                </span>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Nota</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Cancellation Confirmation */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <XCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Batalkan Reservasi?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pemesanan ini akan dibatalkan dan kode barcode tiket tidak dapat lagi digunakan untuk check-in.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetId(null)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
