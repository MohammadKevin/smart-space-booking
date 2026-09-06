"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getSuperAdminTransactions,
  SuperAdminTransaction,
  getApiErrorMessage,
} from "@/lib/api";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah } from "@/components/SpaceCard";
import {
  ReceiptText,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Download,
  Building2,
  Clock,
} from "lucide-react";

export default function SuperAdminTransactionsPage() {
  const [transactions, setTransactions] = useState<SuperAdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSuperAdminTransactions(100);
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

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchQuery.toLowerCase();
      const invoice = t.nomorInvoice.toLowerCase();
      const member = (t.reservasi?.member?.namaMember || "").toLowerCase();
      const owner = (t.reservasi?.owner?.namaCoworking || "").toLowerCase();
      const space = (t.reservasi?.detailReservasi?.space?.namaSpace || "").toLowerCase();
      return invoice.includes(q) || member.includes(q) || owner.includes(q) || space.includes(q);
    });
  }, [transactions, searchQuery]);

  const totalGmv = useMemo(() => {
    return transactions
      .filter((t) => t.statusPembayaran === "lunas")
      .reduce((acc, t) => acc + (t.jumlah || 0), 0);
  }, [transactions]);

  const totalPlatformProfit = useMemo(() => {
    return transactions
      .filter((t) => t.statusPembayaran === "lunas")
      .reduce((acc, t) => acc + (t.platformFee || 0), 0);
  }, [transactions]);

  const handleExportCsv = () => {
    if (!transactions.length) return;
    const headers = [
      "ID",
      "Nomor Invoice",
      "Mitra Coworking",
      "Nama Member",
      "Nama Ruangan",
      "Metode Pembayaran",
      "Total GMV (IDR)",
      "Komisi Platform (IDR)",
      "Hak Space Owner (IDR)",
      "Status Pembayaran",
      "Tanggal Transaksi",
    ];

    const rows = filtered.map((t) => [
      t.id,
      t.nomorInvoice,
      `"${(t.reservasi?.owner?.namaCoworking || "").replace(/"/g, '""')}"`,
      `"${(t.reservasi?.member?.namaMember || "").replace(/"/g, '""')}"`,
      `"${(t.reservasi?.detailReservasi?.space?.namaSpace || "").replace(/"/g, '""')}"`,
      t.metodePembayaran || "-",
      t.jumlah || 0,
      t.platformFee || 0,
      t.ownerPayout || 0,
      t.statusPembayaran,
      t.createdAt ? t.createdAt.split("T")[0] : "-",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `WorkNest_Global_Transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Log Transaksi Global Se-Platform
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Monitoring seluruh arus pembayaran dari semua mitra coworking space dan bagi hasil platform.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Komisi Platform</p>
            <p className="text-sm font-extrabold text-emerald-900 font-mono">{formatRupiah(totalPlatformProfit)}</p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari invoice, coworking, member, atau ruangan..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total: <span className="font-mono text-slate-900 font-bold">{filtered.length}</span> Transaksi Global
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat log transaksi...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Mitra Coworking</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Ruangan</th>
                  <th className="py-3 px-4">Total GMV</th>
                  <th className="py-3 px-4">Komisi Platform</th>
                  <th className="py-3 px-4">Hak Owner</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const memberName = t.reservasi?.member?.namaMember || `Member #${t.reservasi?.memberId}`;
                  const spaceName = t.reservasi?.detailReservasi?.space?.namaSpace || `Space #${t.reservasiId}`;
                  const coworkingName = t.reservasi?.owner?.namaCoworking || "Coworking Space";

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {t.nomorInvoice}
                        <span className="block text-[10px] font-normal text-slate-400 font-sans">
                          {t.createdAt ? t.createdAt.split("T")[0] : "-"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-900">{coworkingName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">{memberName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{spaceName}</td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {formatRupiah(t.jumlah)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {formatRupiah(t.platformFee)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {formatRupiah(t.ownerPayout)}
                      </td>

                      <td className="py-3.5 px-4">
                        <PaymentStatusBadge status={t.statusPembayaran} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center max-w-md mx-auto space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
              <ReceiptText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Transaksi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery ? "Tidak ditemukan transaksi sesuai kata kunci pencarian." : "Belum ada transaksi sewa yang tercatat di platform."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
