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
  Wallet,
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

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
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
    [transactions],
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
      await syncPayment(t.id);
      setActionSuccess(`Status transaksi ${t.nomorInvoice} berhasil disinkronkan.`);
      await fetchTransactions();
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

  const tabs: { id: PaymentTab; label: string }[] = [
    { id: "all", label: `Semua (${counts.all})` },
    { id: "lunas", label: `Lunas (${counts.lunas})` },
    { id: "menunggu_pembayaran", label: `Menunggu Bayar (${counts.menunggu_pembayaran})` },
    { id: "belum_bayar", label: `Belum Bayar (${counts.belum_bayar})` },
    { id: "refund", label: `Refund (${counts.refund})` },
    { id: "gagal", label: `Gagal (${counts.gagal})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Transaksi & Pembayaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Pantau seluruh pembayaran member, verifikasi status Midtrans, lacak invoice, dan kelola refund secara real-time.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Lunas</p>
            <p className="text-sm font-extrabold text-emerald-900 font-mono">{formatRupiah(totalLunas)}</p>
          </div>
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-cyan-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} className="font-bold text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full lg:w-auto overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-cyan-950 shadow-2xs border border-cyan-200"
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
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shrink-0">
            <ReceiptText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Transaksi</p>
            <p className="text-lg font-bold text-slate-900">{counts.all}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Lunas</p>
            <p className="text-lg font-bold text-slate-900">{counts.lunas}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Menunggu Bayar</p>
            <p className="text-lg font-bold text-slate-900">{counts.menunggu_pembayaran}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Refund</p>
            <p className="text-lg font-bold text-slate-900">{counts.refund}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-3 font-medium">Memuat data transaksi...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Ruangan</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4">Jumlah</th>
                  <th className="py-3 px-4">Status Bayar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const memberName = t.reservasi?.member?.namaMember || `Member #${t.reservasi?.memberId}`;
                  const spaceName = t.reservasi?.detailReservasi?.space?.namaSpace || `Space #${t.reservasiId}`;
                  return (
                    <tr key={t.id} className="hover:bg-cyan-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{t.nomorInvoice}</p>
                        <p className="text-[10px] text-slate-400">#{t.reservasi?.id}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{memberName}</p>
                            <StatusBadge status={(t.reservasi?.status || "") as any} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{spaceName}</td>
                      <td className="py-3.5 px-4 text-slate-600 capitalize">
                        {t.metodePembayaran ? t.metodePembayaran.replace(/_/g, " ") : "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{formatRupiah(t.jumlah)}</p>
                        {t.dibayarPada && (
                          <p className="text-[10px] text-emerald-700">
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
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Detail
                        </button>
                        <button
                          type="button"
                          disabled={syncingId === t.id}
                          onClick={() => handleSync(t)}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-60"
                        >
                          {syncingId === t.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 text-cyan-600" />
                          )}
                          Sync
                        </button>
                        {(isOwner || isStaff) && t.statusPembayaran === "lunas" && (
                          <button
                            type="button"
                            onClick={() => setRefundTarget(t)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
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
          <div className="p-16 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto border border-cyan-200">
              <ReceiptText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Data Transaksi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? "Tidak ditemukan transaksi dengan kata kunci tersebut."
                : "Belum ada transaksi pembayaran pada kategori yang dipilih. Transaksi dibuat otomatis saat member memesan ruangan."}
            </p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">{selected.nomorInvoice}</h3>
                  <p className="text-[11px] text-slate-400">Detail Transaksi Pembayaran</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Informasi Pembayaran</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selected.reservasi?.member?.namaMember || "Member"}</p>
                    <p className="text-slate-500">{selected.reservasi?.member?.instansi || "Instansi Umum"}</p>
                  </div>
                  <PaymentStatusBadge status={selected.statusPembayaran} />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Metode</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selected.metodePembayaran ? selected.metodePembayaran.replace(/_/g, " ") : "Belum dipilih"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Dibayar Pada</span>
                    <span className="font-semibold text-slate-800">
                      {selected.dibayarPada
                        ? new Date(selected.dibayarPada).toLocaleString("id-ID")
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ruangan</span>
                  <p className="font-bold text-slate-900">{selected.reservasi?.detailReservasi?.space?.namaSpace || "Space"}</p>
                  <p className="text-[11px] capitalize text-slate-500">
                    {selected.reservasi?.jamMulai} WIB ({selected.reservasi?.durasiJam} Jam)
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Reservasi</span>
                  <div className="pt-0.5">
                    <StatusBadge status={(selected.reservasi?.status || "") as any} />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800">Jumlah Dibayar</span>
                  <p className="text-lg font-extrabold text-slate-900 font-mono">{formatRupiah(selected.jumlah)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSync(selected)}
                  disabled={syncingId === selected.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {syncingId === selected.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Sync Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
              <RotateCcw className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Mark as Refund?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Transaksi <span className="font-mono font-bold">{refundTarget.nomorInvoice}</span> sebesar{" "}
                <span className="font-bold">{formatRupiah(refundTarget.jumlah)}</span> akan ditandai sebagai refund.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button type="button" onClick={() => setRefundTarget(null)} className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer">
                Batal
              </button>
              <button
                type="button"
                onClick={handleRefund}
                disabled={refunding}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                {refunding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Ya, Refund</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}