"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getTransactions,
  syncPayment,
  markRefund,
  Transaksi,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah } from "@/components/SpaceCard";
import {
  ReceiptText,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  RotateCcw,
  Download,
  Building,
} from "lucide-react";

type PaymentTab = "all" | "lunas" | "menunggu_pembayaran" | "belum_bayar" | "refund" | "gagal";

export default function OwnerTransactionsPage() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<PaymentTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Transaksi | null>(null);
  const [refundTarget, setRefundTarget] = useState<Transaksi | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const fetchTransactions = useCallback(async (autoSync = true) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      const list = Array.isArray(data) ? data : [];
      setTransactions(list);

      // Auto-sync pending transactions in the background
      if (autoSync && list.length > 0) {
        const pendingTxs = list.filter(
          (t) =>
            t.statusPembayaran === "menunggu_pembayaran" ||
            t.statusPembayaran === "belum_bayar"
        );

        if (pendingTxs.length > 0) {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token") || localStorage.getItem("access_token")
              : null;

          Promise.all(
            pendingTxs.map(async (t) => {
              try {
                const orderId = t.midtransOrderId || t.nomorInvoice;
                if (orderId) {
                  const checkRes = await fetch(
                    `/api/charge/status?orderId=${encodeURIComponent(orderId)}&transactionId=${t.id}&reservationId=${t.reservasiId}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                  );
                  const statusData = await checkRes.json();
                  if (statusData.isPaid) return true;
                }
                const syncRes = await syncPayment(t.id);
                const updated = syncRes?.data || syncRes;
                if (updated?.statusPembayaran === "lunas") return true;
              } catch {}
              return false;
            })
          ).then((results) => {
            if (results.some(Boolean)) {
              getTransactions()
                .then((refreshed) => {
                  if (Array.isArray(refreshed)) setTransactions(refreshed);
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

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const counts = useMemo(() => {
    const res: Record<PaymentTab, number> = {
      all: transactions.length,
      lunas: 0,
      menunggu_pembayaran: 0,
      belum_bayar: 0,
      refund: 0,
      gagal: 0,
    };
    for (const t of transactions) {
      const s = t.statusPembayaran as PaymentTab;
      if (res[s] !== undefined) res[s] += 1;
    }
    return res;
  }, [transactions]);

  const totalLunas = useMemo(
    () =>
      transactions
        .filter((t) => t.statusPembayaran === "lunas")
        .reduce((acc, t) => acc + (t.jumlah || 0), 0),
    [transactions]
  );

  const isOwner = user?.role?.toLowerCase() === "admin_space" || user?.role?.toLowerCase() === "owner";
  const isStaff = user?.role?.toLowerCase() === "staff";

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchTab = activeTab === "all" || t.statusPembayaran === activeTab;
      const q = searchQuery.toLowerCase();
      const memberName = t.reservasi?.member?.namaMember || "";
      const spaceName = t.reservasi?.detailReservasi?.space?.namaSpace || "";
      const matchQuery =
        !q ||
        t.nomorInvoice.toLowerCase().includes(q) ||
        memberName.toLowerCase().includes(q) ||
        spaceName.toLowerCase().includes(q) ||
        String(t.reservasiId).includes(q);
      return matchTab && matchQuery;
    });
  }, [transactions, activeTab, searchQuery]);

  const handleSync = async (t: Transaksi) => {
    setSyncingId(t.id);
    setError(null);
    try {
      const orderId = t.midtransOrderId || t.nomorInvoice;
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("access_token")
          : null;

      if (orderId) {
        try {
          await fetch(
            `/api/charge/status?orderId=${encodeURIComponent(orderId)}&transactionId=${t.id}&reservationId=${t.reservasiId}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
        } catch {}
      }

      await syncPayment(t.id);
      setActionSuccess(`Status transaksi ${t.nomorInvoice} berhasil disinkronkan.`);
      await fetchTransactions(false);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setSyncingId(null);
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    setError(null);
    try {
      await markRefund(refundTarget.id);
      setActionSuccess(`Transaksi ${refundTarget.nomorInvoice} ditandai sebagai refund.`);
      setRefundTarget(null);
      await fetchTransactions();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setRefunding(false);
    }
  };

  const handleExportCsv = () => {
    if (!transactions.length) return;
    const headers = [
      "ID",
      "Nomor Invoice",
      "ID Reservasi",
      "Nama Member",
      "Nama Ruangan",
      "Metode Pembayaran",
      "Nominal",
      "Status Pembayaran",
      "Tanggal Dibuat",
      "Tanggal Dibayar",
    ];

    const rows = filtered.map((t) => [
      t.id,
      t.nomorInvoice,
      t.reservasiId,
      `"${(t.reservasi?.member?.namaMember || "").replace(/"/g, '""')}"`,
      `"${(t.reservasi?.detailReservasi?.space?.namaSpace || "").replace(/"/g, '""')}"`,
      t.metodePembayaran || "-",
      t.jumlah || 0,
      t.statusPembayaran,
      t.createdAt ? t.createdAt.split("T")[0] : "-",
      t.dibayarPada ? t.dibayarPada.split("T")[0] : "-",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `WorkNest-Transaksi-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs: { id: PaymentTab; label: string }[] = [
    { id: "all", label: `Semua (${counts.all})` },
    { id: "lunas", label: `Lunas (${counts.lunas})` },
    { id: "menunggu_pembayaran", label: `Menunggu (${counts.menunggu_pembayaran})` },
    { id: "belum_bayar", label: `Belum Bayar (${counts.belum_bayar})` },
    { id: "refund", label: `Refund (${counts.refund})` },
    { id: "gagal", label: `Gagal (${counts.gagal})` },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>WORKSPACE OWNER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Buku Kas &amp; Pembayaran Midtrans
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Transaksi &amp; Pembayaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola arus kas masuk, invoice reservasi, status pembayaran Midtrans, dan rekonsiliasi bagi hasil venue.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xs bg-slate-50 border border-slate-200 text-right">
            <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Total Terbayar</p>
            <p className="text-sm font-bold text-slate-900 font-mono">{formatRupiah(totalLunas)}</p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={() => fetchTransactions(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#006370]" : "text-slate-500"}`} />
            <span>Perbarui</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xs bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="font-bold text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xs bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-2xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Terjadi Kendala</p>
              <p className="text-slate-600">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchTransactions(true)}
            className="px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xs font-semibold transition-colors shrink-0 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xs border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xs w-full lg:w-auto overflow-x-auto text-xs font-semibold">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari invoice / member / ruangan..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-xs border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-[#006370] animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat data transaksi...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">INVOICE</th>
                  <th className="py-3 px-4 font-bold">MEMBER</th>
                  <th className="py-3 px-4 font-bold">RUANGAN</th>
                  <th className="py-3 px-4 font-bold">METODE</th>
                  <th className="py-3 px-4 font-bold">NOMINAL</th>
                  <th className="py-3 px-4 font-bold">STATUS BAYAR</th>
                  <th className="py-3 px-4 font-bold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((t) => {
                  const memberName = t.reservasi?.member?.namaMember || `Member #${t.reservasi?.memberId}`;
                  const spaceName = t.reservasi?.detailReservasi?.space?.namaSpace || `Space #${t.reservasiId}`;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{t.nomorInvoice}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID Reservasi: #{t.reservasiId}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xs bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{memberName}</p>
                            <StatusBadge status={(t.reservasi?.status || "") as any} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{spaceName}</td>
                      <td className="py-3.5 px-4 text-slate-600 capitalize">
                        {t.metodePembayaran ? t.metodePembayaran.replace(/_/g, " ") : "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{formatRupiah(t.jumlah)}</p>
                        {t.dibayarPada && (
                          <p className="text-[10px] text-emerald-700 font-medium">
                            {new Date(t.dibayarPada).toLocaleDateString("id-ID")}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <PaymentStatusBadge status={t.statusPembayaran} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelected(t)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xs border border-slate-200 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Detail
                        </button>
                        <button
                          type="button"
                          disabled={syncingId === t.id}
                          onClick={() => handleSync(t)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xs border border-slate-200 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-60"
                        >
                          {syncingId === t.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#006370]" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          Sync
                        </button>
                        {(isOwner || isStaff) && t.statusPembayaran === "lunas" && (
                          <button
                            type="button"
                            onClick={() => setRefundTarget(t)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xs border border-rose-200 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center max-w-md mx-auto space-y-2.5">
            <div className="w-10 h-10 rounded-xs bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
              <ReceiptText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Transaksi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? "Tidak ditemukan transaksi dengan kata kunci pencarian tersebut."
                : "Belum ada catatan transaksi pada filter yang dipilih."}
            </p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xs max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center border border-[#BCE3DE]">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight font-mono">{selected.nomorInvoice}</h3>
                  <p className="text-[11px] text-slate-400">Detail Transaksi &amp; Pembayaran</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xs hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xs bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Informasi Pemesan</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selected.reservasi?.member?.namaMember || "Member"}</p>
                    <p className="text-slate-500">{selected.reservasi?.member?.instansi || "Instansi Umum"}</p>
                  </div>
                  <PaymentStatusBadge status={selected.statusPembayaran} />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">Metode</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selected.metodePembayaran ? selected.metodePembayaran.replace(/_/g, " ") : "Belum dipilih"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">Dibayar Pada</span>
                    <span className="font-semibold text-slate-800">
                      {selected.dibayarPada
                        ? new Date(selected.dibayarPada).toLocaleString("id-ID")
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xs bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Ruangan</span>
                  <p className="font-bold text-slate-900">{selected.reservasi?.detailReservasi?.space?.namaSpace || "Space"}</p>
                  <p className="text-[11px] text-slate-500">
                    {selected.reservasi?.jamMulai} WIB ({selected.reservasi?.durasiJam} Jam)
                  </p>
                </div>
                <div className="p-3 rounded-xs bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Status Reservasi</span>
                  <div className="pt-0.5">
                    <StatusBadge status={(selected.reservasi?.status || "") as any} />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Total Tagihan</span>
                  <p className="text-lg font-bold text-slate-900 font-mono">{formatRupiah(selected.jumlah)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSync(selected)}
                  disabled={syncingId === selected.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-semibold rounded-xs shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {syncingId === selected.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Sync Midtrans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xs max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xs bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-serif">Tandai sebagai Refund?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Transaksi <span className="font-mono font-bold text-slate-900">{refundTarget.nomorInvoice}</span> sebesar{" "}
                <span className="font-bold text-slate-900">{formatRupiah(refundTarget.jumlah)}</span> akan ditandai sebagai refund.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRefund}
                disabled={refunding}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                {refunding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Konfirmasi Refund</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
