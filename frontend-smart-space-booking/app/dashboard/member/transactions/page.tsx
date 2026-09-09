"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getTransactions,
  startPayment,
  syncPayment,
  Transaksi,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { formatRupiah } from "@/components/SpaceCard";
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
  const [selected, setSelected] = useState<Transaksi | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const loadTransactions = useCallback(async (autoSync = true) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      const list = Array.isArray(data) ? data : [];
      setTransactions(list);

      // Auto-sync pending transactions in background
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

  const handleSync = async (t: Transaksi) => {
    setSyncingId(t.id);
    setError(null);
    setMessage(null);
    try {
      const orderId = t.midtransOrderId || t.nomorInvoice;
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("access_token")
          : null;

      let isPaid = false;

      if (orderId) {
        try {
          const checkRes = await fetch(
            `/api/charge/status?orderId=${encodeURIComponent(orderId)}&transactionId=${t.id}&reservationId=${t.reservasiId}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          const statusData = await checkRes.json();
          if (statusData.isPaid) {
            isPaid = true;
          }
        } catch {}
      }

      const res = await syncPayment(t.id);
      const updatedTx = res?.data || res;

      if (isPaid || updatedTx?.statusPembayaran === "lunas") {
        setMessage(`Pembayaran invoice ${t.nomorInvoice} berhasil diverifikasi (Lunas)!`);
      } else {
        setMessage(`Status pembayaran ${t.nomorInvoice}: ${updatedTx?.statusPembayaran || "menunggu pembayaran"}.`);
      }
      await loadTransactions(false);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setSyncingId(null);
    }
  };

  const canPay = (t: Transaksi) =>
    t.statusPembayaran !== "lunas" && t.statusPembayaran !== "refund";

  const tabs: { id: PaymentTab; label: string }[] = [
    { id: "all", label: `Semua (${counts.all})` },
    { id: "lunas", label: `Lunas (${counts.lunas})` },
    { id: "menunggu_pembayaran", label: `Menunggu Bayar (${counts.menunggu_pembayaran})` },
    { id: "belum_bayar", label: `Belum Bayar (${counts.belum_bayar})` },
    { id: "refund", label: `Refund (${counts.refund})` },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>PORTAL MEMBER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Riwayat Pembayaran &amp; Invoice
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Riwayat Transaksi &amp; Tagihan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Pantau pembayaran reservasi ruangan Anda, selesaikan tagihan yang belum lunas, dan verifikasi status transaksi Midtrans.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadTransactions(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#006370]" : "text-slate-500"}`} />
            <span>Perbarui</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xs bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="font-bold text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xs bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xs border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xs bg-[#006370]/10 text-[#006370] border border-[#006370]/20 flex items-center justify-center shrink-0">
            <ReceiptText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">TOTAL INVOICE</p>
            <p className="text-lg font-bold text-slate-900 font-mono">{counts.all}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xs border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">LUNAS</p>
            <p className="text-lg font-bold text-slate-900 font-mono">{counts.lunas}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xs border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xs bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">PERLU DIBAYAR</p>
            <p className="text-lg font-bold text-slate-900 font-mono">{counts.menunggu_pembayaran + counts.belum_bayar}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xs border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xs bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">TAGIHAN AKTIF</p>
            <p className="text-lg font-bold text-slate-900 font-mono">{formatRupiah(totalPending)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xs border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xs w-full lg:w-auto overflow-x-auto text-xs font-semibold">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-[#006370] shadow-2xs font-bold"
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
            placeholder="Cari nomor invoice / ruangan..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-16 text-center bg-white rounded-xs border border-slate-200 shadow-2xs">
            <Loader2 className="w-7 h-7 text-[#006370] animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2 font-medium">Memuat transaksi...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((t) => {
            const spaceName = t.reservasi?.detailReservasi?.space?.namaSpace || `Space #${t.reservasiId}`;
            return (
              <div
                key={t.id}
                className="bg-white rounded-xs border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xs bg-[#E6F4F2] text-[#006370] border border-[#BCE3DE] flex items-center justify-center shrink-0">
                    <ReceiptText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-slate-900 truncate">{t.nomorInvoice}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{spaceName}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
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
                    {t.statusPembayaran !== "lunas" && t.statusPembayaran !== "refund" && (
                      <button
                        type="button"
                        onClick={() => handleSync(t)}
                        disabled={syncingId === t.id}
                        title="Periksa konfirmasi pembayaran Midtrans"
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xs border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingId === t.id ? "animate-spin" : ""}`} />
                        <span>Cek Status</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelected(t)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Detail</span>
                    </button>

                    {canPay(t) && (
                      <Link
                        href={`/checkout/${t.reservasiId}`}
                        className="px-3 py-1.5 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold rounded-xs shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center max-w-md mx-auto bg-white rounded-xs border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-xs bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Tidak Ada Transaksi</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchQuery
                  ? "Tidak ditemukan transaksi dengan kata kunci tersebut."
                  : "Belum ada transaksi pembayaran pada kategori ini. Invoice akan dibuat otomatis saat Anda memesan ruangan."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/spaces")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold rounded-xs shadow-2xs transition-colors cursor-pointer"
            >
              <span>Jelajahi Ruangan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
                  <p className="text-[11px] text-slate-400">Rincian Invoice &amp; Pembayaran</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-xs hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xs bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
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
                <div className="p-3 rounded-xs bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Ruangan</span>
                  <p className="font-bold text-slate-900">
                    {selected.reservasi?.detailReservasi?.space?.namaSpace || "Space"}
                  </p>
                  <p className="text-[11px] text-slate-500 uppercase font-mono">
                    {selected.reservasi?.detailReservasi?.space?.tipe || "Workstation"}
                  </p>
                </div>
                <div className="p-3 rounded-xs bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Jadwal</span>
                  <p className="font-bold text-slate-900">
                    {selected.reservasi?.tanggalReservasi?.split("T")[0] || "-"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selected.reservasi?.jamMulai} WIB ({selected.reservasi?.durasiJam} Jam)
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xs bg-slate-50 border border-slate-200 space-y-1.5">
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
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900">Total Tagihan</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">{formatRupiah(selected.jumlah)}</span>
                </div>
              </div>

              {selected.statusPembayaran !== "lunas" && (
                <button
                  type="button"
                  onClick={async () => {
                    await handleSync(selected);
                    setSelected(null);
                  }}
                  disabled={syncingId === selected.id}
                  className="w-full py-2.5 px-4 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold rounded-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingId === selected.id ? "animate-spin" : ""}`} />
                  <span>Cek Status Pembayaran Midtrans</span>
                </button>
              )}

              {canPay(selected) && (
                <Link
                  href={`/checkout/${selected.reservasiId}`}
                  className="w-full py-2.5 px-4 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold rounded-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Bayar Sekarang (Buka Checkout)</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
