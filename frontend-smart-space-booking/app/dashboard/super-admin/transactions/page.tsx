"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getSuperAdminTransactions,
  SuperAdminTransaction,
  getApiErrorMessage,
} from "@/lib/api";
import { formatRupiah } from "@/components/SpaceCard";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import {
  ReceiptText,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Download,
  Building2,
  Clock,
  CreditCard,
  Building,
  CheckCircle2,
  Calendar,
  Coins,
  X,
  User,
  QrCode,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function SuperAdminTransactionsPage() {
  const [transactions, setTransactions] = useState<SuperAdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "lunas" | "menunggu" | "gagal">("all");
  const [selectedTx, setSelectedTx] = useState<SuperAdminTransaction | null>(null);

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

  const totalGmv = useMemo(() => {
    return transactions
      .filter((t) => t.statusPembayaran === "lunas")
      .reduce((acc, t) => acc + (t.jumlah || 0), 0);
  }, [transactions]);

  const platformTake = useMemo(() => {
    return transactions
      .filter((t) => t.statusPembayaran === "lunas")
      .reduce((acc, t) => acc + (t.platformFee || Math.round((t.jumlah || 0) * 0.12)), 0);
  }, [transactions]);

  const hostDisbursements = useMemo(() => {
    return Math.max(0, totalGmv - platformTake);
  }, [totalGmv, platformTake]);

  const settledCount = useMemo(() => {
    return transactions.filter((t) => t.statusPembayaran === "lunas").length;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const invoice = (t.nomorInvoice || "").toLowerCase();
      const member = (t.reservasi?.member?.namaMember || "").toLowerCase();
      const telp = (t.reservasi?.member?.telp || "").toLowerCase();
      const owner = (t.reservasi?.owner?.namaCoworking || "").toLowerCase();
      const space = (t.reservasi?.detailReservasi?.space?.namaSpace || "").toLowerCase();

      const matchSearch =
        !q ||
        invoice.includes(q) ||
        member.includes(q) ||
        telp.includes(q) ||
        owner.includes(q) ||
        space.includes(q);

      const status = t.statusPembayaran?.toLowerCase() || "";
      const matchStatus =
        statusTab === "all" ||
        (statusTab === "lunas" && status === "lunas") ||
        (statusTab === "menunggu" &&
          (status === "menunggu_pembayaran" || status === "menunggu" || status === "belum_bayar")) ||
        (statusTab === "gagal" && (status === "gagal" || status === "dibatalkan" || status === "refund"));

      return matchSearch && matchStatus;
    });
  }, [transactions, searchQuery, statusTab]);

  const handleExportCsv = () => {
    const header = "No Invoice,Member,Coworking,Ruangan,Metode Bayar,Nilai Bruto (GMV),Komisi Platform,Payout Mitra,Status Pembayaran,Tanggal\n";
    const rows = filteredTransactions
      .map((t) => {
        const gross = t.jumlah || 0;
        const take = t.platformFee || Math.round(gross * (t.commissionPercent ? t.commissionPercent / 100 : 0.12));
        const host = t.ownerPayout || gross - take;
        const date = t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : "";
        return `"${t.nomorInvoice || ""}","${t.reservasi?.member?.namaMember || ""}","${t.reservasi?.owner?.namaCoworking || ""}","${t.reservasi?.detailReservasi?.space?.namaSpace || ""}","${t.metodePembayaran || "QRIS"}",${gross},${take},${host},"${t.statusPembayaran}","${date}"`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worknest-audit-transaksi-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Rekapitulasi Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Halaman ini digunakan untuk melihat rekapitulasi transaksi yang terjadi di platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#006370]" : ""}`} />
            <span>Perbarui</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredTransactions.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              TOTAL GMV TRANSAKSI
            </span>
            <Building className="w-4 h-4 text-[#006370]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {formatRupiah(totalGmv)}
          </div>
          <p className="text-[11px] text-slate-500">
            Nilai bruto seluruh transaksi lunas
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              KOMISI PLATFORM
            </span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#006370] font-mono">
            {formatRupiah(platformTake)}
          </div>
          <p className="text-[11px] text-slate-500">
            Retained fee platform WorkNest
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              TOTAL PAYOUT MITRA
            </span>
            <ReceiptText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {formatRupiah(hostDisbursements)}
          </div>
          <p className="text-[11px] text-slate-500">
            Hak bagi hasil mitra venue
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              TRANSAKSI LUNAS
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {settledCount}{" "}
            <span className="text-xs font-normal text-slate-500 font-sans">
              / {transactions.length}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            Terselesaikan dengan sukses
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. invoice, nama member, venue..."
              className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xs text-xs font-semibold self-stretch sm:self-auto overflow-x-auto">
            {[
              { key: "all", label: "Semua" },
              { key: "lunas", label: "Lunas" },
              { key: "menunggu", label: "Menunggu" },
              { key: "gagal", label: "Gagal / Refund" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-xs whitespace-nowrap transition-colors cursor-pointer ${
                  statusTab === tab.key
                    ? "bg-white text-[#006370] font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">INVOICE &amp; WAKTU</th>
                <th className="py-3.5 px-4 font-bold">MEMBER &amp; VENUE</th>
                <th className="py-3.5 px-4 font-bold">RUANGAN</th>
                <th className="py-3.5 px-4 font-bold">NILAI GMV</th>
                <th className="py-3.5 px-4 font-bold">KOMISI</th>
                <th className="py-3.5 px-4 font-bold">PAYOUT MITRA</th>
                <th className="py-3.5 px-4 font-bold">STATUS</th>
                <th className="py-3.5 px-4 font-bold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#006370] mx-auto mb-2" />
                    <span>Memuat riwayat transaksi...</span>
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const gross = tx.jumlah || 0;
                  const fee = tx.platformFee || Math.round(gross * 0.12);
                  const payout = tx.ownerPayout || gross - fee;
                  const dateStr = tx.createdAt
                    ? new Date(tx.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">
                          {tx.nomorInvoice || `INV-${tx.id}`}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {tx.reservasi?.member?.namaMember || "Member"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {tx.reservasi?.owner?.namaCoworking || "WorkNest Hub"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <p className="font-semibold text-slate-900">
                          {tx.reservasi?.detailReservasi?.space?.namaSpace || "Ruangan"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {tx.reservasi?.durasiJam || 1} Jam Sesi
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {formatRupiah(gross)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#006370]">
                        {formatRupiah(fee)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {formatRupiah(payout)}
                      </td>

                      <td className="py-3.5 px-4">
                        <PaymentStatusBadge status={tx.statusPembayaran} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="px-3 py-1.5 rounded-xs border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {searchQuery
                      ? "Tidak ada transaksi yang cocok dengan kata kunci pencarian."
                      : "Belum ada riwayat transaksi yang tercatat di platform."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Rincian Transaksi
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedTx.nomorInvoice || `INV-${selectedTx.id}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xs border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Status Pembayaran</span>
                  <PaymentStatusBadge status={selectedTx.statusPembayaran} />
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Metode / Gateway</span>
                  <span className="font-bold text-slate-800">
                    {selectedTx.metodePembayaran || "Midtrans QRIS / VA"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xs space-y-2 border border-slate-100">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  INFORMASI RESERVASI &amp; RUANGAN
                </p>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Member</span>
                    <strong className="text-slate-900">
                      {selectedTx.reservasi?.member?.namaMember || "Member"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mitra Venue</span>
                    <strong className="text-slate-900">
                      {selectedTx.reservasi?.owner?.namaCoworking || "WorkNest Hub"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Ruangan</span>
                    <span className="text-slate-900">
                      {selectedTx.reservasi?.detailReservasi?.space?.namaSpace || "Ruangan"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Durasi Sesi</span>
                    <span className="text-slate-900">
                      {selectedTx.reservasi?.durasiJam || 1} Jam Sesi
                    </span>
                  </div>
                  {selectedTx.reservasi?.qrCode && (
                    <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Kode Akses QR</span>
                      <span className="font-mono font-bold text-[#006370]">
                        {selectedTx.reservasi.qrCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-[#E6F4F2]/30 rounded-xs border border-[#BCE3DE] space-y-2">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#006370]">
                  RINCIAN PEMBAGIAN DANA
                </p>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span>Total Pembayaran Member (Bruto)</span>
                    <strong className="font-mono text-slate-900">
                      {formatRupiah(selectedTx.jumlah || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#006370]">
                    <span>Komisi Platform WorkNest</span>
                    <strong className="font-mono">
                      {formatRupiah(selectedTx.platformFee || Math.round((selectedTx.jumlah || 0) * 0.12))}
                    </strong>
                  </div>
                  <div className="flex justify-between text-emerald-800 pt-1.5 border-t border-[#BCE3DE]">
                    <span className="font-bold">Payout Bersih Mitra Venue</span>
                    <strong className="font-mono text-sm">
                      {formatRupiah(
                        selectedTx.ownerPayout ||
                          (selectedTx.jumlah || 0) - (selectedTx.platformFee || Math.round((selectedTx.jumlah || 0) * 0.12))
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
