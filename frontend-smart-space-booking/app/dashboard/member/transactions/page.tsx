"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getTransactions,
  startPayment,
  Transaksi,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { formatRupiah } from "@/components/SpaceCard";
import { snapPay } from "@/lib/midtrans-snap";
import {
  Wallet,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ReceiptText,
  Building2,
  ArrowRight,
  CreditCard,
} from "lucide-react";

type PaymentTab = "all" | "lunas" | "menunggu_pembayaran" | "belum_bayar" | "refund" | "gagal";

export default function MemberTransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<PaymentTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Transaksi | null>(null);

  const loadTransactions = useCallback(async () => {
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
    loadTransactions();
  }, [loadTransactions]);

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

  const totalPending = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            t.statusPembayaran === "belum_bayar" ||
            t.statusPembayaran === "menunggu_pembayaran",
        )
        .reduce((acc, t) => acc + (t.jumlah || 0), 0),
    [transactions],
  );

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchTab = activeTab === "all" || t.statusPembayaran === activeTab;
      const q = searchQuery.toLowerCase();
      const spaceName = t.reservasi?.detailReservasi?.space?.namaSpace?.toLowerCase() || "";
      const matchQuery = !q || t.nomorInvoice.toLowerCase().includes(q) || spaceName.includes(q);
      return matchTab && matchQuery;
    });
  }, [transactions, activeTab, searchQuery]);

  const handlePay = async (t: Transaksi) => {
    setPayingId(t.id);
    setError(null);
    setMessage(null);
    try {
      const response = await startPayment(t.reservasiId);
      const result = response.data;
      await snapPay(result.clientKey, result.snapScriptUrl, result.snapToken, {
        onSuccess: async () => {
          setMessage(`Pembayaran ${result.nomorInvoice} berhasil. Terima kasih!`);
          await loadTransactions();
        },
        onPending: async () => {
          setMessage("Pembayaran sedang menunggu konfirmasi. Status akan diperbarui otomatis.");
          await loadTransactions();
        },
        onError: () => {
          setError("Pembayaran gagal atau dibatalkan oleh sistem pembayaran.");
        },
        onClose: () => setPayingId(null),
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
      setPayingId(null);
    }
  };

  const canPay = (t: Transaksi) =>
    t.reservasi?.status === "disetujui" &&
    t.statusPembayaran !== "lunas" &&
    t.statusPembayaran !== "refund";

  const tabs: { id: PaymentTab; label: string }[] = [
    { id: "all", label: `Semua (${counts.all})` },
    { id: "lunas", label: `Lunas (${counts.lunas})` },
    { id: "menunggu_pembayaran", label: `Menunggu Bayar (${counts.menunggu_pembayaran})` },
    { id: "belum_bayar", label: `Belum Bayar (${counts.belum_bayar})` },
    { id: "refund", label: `Refund (${counts.refund})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <Wallet className="w-3.5 h-3.5 text-sky-600" />
            <span>Riwayat Pembayaran Saya</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Transaksi & Invoice
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Kelola dan pantau seluruh pembayaran reservasi Anda, lengkapi tagihan yang belum lunas, dan unduh bukti transaksi.
          </p>
        </div>
        <button
          type="button"
          onClick={loadTransactions}
          disabled={loading}
          className="relative z-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-sky-300 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : "text-slate-400"}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-sky-800 text-xs shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="font-bold text-sky-700 hover:text-sky-900 p-1 cursor-pointer">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
            <ReceiptText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Invoice</p>
            <p className="text-lg font-bold text-slate-900">{counts.all}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Lunas</p>
            <p className="text-lg font-bold text-slate-900">{counts.lunas}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Perlu Dibayar</p>
            <p className="text-lg font-bold text-slate-900">{counts.menunggu_pembayaran + counts.belum_bayar}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Tagihan Aktif</p>
            <p className="text-lg font-bold text-slate-900 font-mono">{formatRupiah(totalPending)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full lg:w-auto overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-sky-950 shadow-2xs border border-sky-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari invoice / ruangan..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
            <Loader2 className="w-7 h-7 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2 font-medium">Memuat transaksi...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((t) => {
            const spaceName = t.reservasi?.detailReservasi?.space?.namaSpace || `Space #${t.reservasiId}`;
            return (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                    <ReceiptText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-slate-900 truncate">{t.nomorInvoice}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{spaceName}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.reservasi?.tanggalReservasi?.split("T")[0]} • {t.reservasi?.jamMulai} WIB ({t.reservasi?.durasiJam} Jam)
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900">{formatRupiah(t.jumlah)}</p>
                    <div className="mt-1 flex items-center gap-1.5 justify-end">
                      <PaymentStatusBadge status={t.statusPembayaran} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(t)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                      Detail
                    </button>

                    {canPay(t) && (
                      <button
                        type="button"
                        disabled={payingId === t.id}
                        onClick={() => handlePay(t)}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {payingId === t.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5" />
                        )}
                        Bayar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center max-w-md mx-auto bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-200">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Transaksi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? "Tidak ditemukan transaksi dengan kata kunci tersebut."
                : "Belum ada transaksi pembayaran pada kategori ini. Invoice akan dibuat otomatis saat Anda memesan ruangan."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/spaces")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <span>Jelajahi Ruangan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">{selected.nomorInvoice}</h3>
                  <p className="text-[11px] text-slate-400">Rincian Invoice & Pembayaran</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Informasi Pemesan
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {selected.reservasi?.member?.namaMember || user?.email || "Member"}
                    </p>
                    <p className="text-slate-500">{selected.reservasi?.member?.instansi || "Instansi Umum"}</p>
                  </div>
                  <PaymentStatusBadge status={selected.statusPembayaran} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ruangan</span>
                  <p className="font-bold text-slate-900">
                    {selected.reservasi?.detailReservasi?.space?.namaSpace || "Space"}
                  </p>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {selected.reservasi?.detailReservasi?.space?.tipe || "Workstation"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jadwal</span>
                  <p className="font-bold text-slate-900">
                    {selected.reservasi?.tanggalReservasi?.split("T")[0] || "-"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selected.reservasi?.jamMulai} WIB ({selected.reservasi?.durasiJam} Jam)
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Metode Pembayaran</span>
                  <span className="font-semibold capitalize">
                    {selected.metodePembayaran ? selected.metodePembayaran.replace(/_/g, " ") : "Belum dipilih"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Dibayar Pada</span>
                  <span className="font-semibold">
                    {selected.dibayarPada ? new Date(selected.dibayarPada).toLocaleString("id-ID") : "-"}
                  </span>
                </div>
                <div className="pt-2 border-t border-sky-100 flex items-center justify-between">
                  <span className="font-bold text-slate-900">Total Tagihan</span>
                  <span className="text-lg font-extrabold text-slate-900 font-mono">{formatRupiah(selected.jumlah)}</span>
                </div>
              </div>

              {canPay(selected) && (
                <button
                  type="button"
                  disabled={payingId === selected.id}
                  onClick={() => handlePay(selected)}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {payingId === selected.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5" />
                  )}
                  Bayar Sekarang
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}