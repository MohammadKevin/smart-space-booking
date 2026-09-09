"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  getSuperAdminCommission,
  updateSuperAdminCommission,
  getSuperAdminOverview,
  SuperAdminOverview,
  getApiErrorMessage,
} from "@/lib/api";
import { formatRupiah } from "@/components/SpaceCard";
import {
  TicketPercent,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  ShieldCheck,
  CreditCard,
  Coins,
  Receipt,
  ArrowRight,
  Info,
  Sliders,
  Check,
  Building,
} from "lucide-react";

export default function SuperAdminCommissionPage() {
  const [commissionRate, setCommissionRate] = useState<number>(12.0);
  const [initialRate, setInitialRate] = useState<number>(12.0);
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [simulationAmount, setSimulationAmount] = useState<number>(250000);

  const fetchCommissionData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [comm, ovData] = await Promise.all([
        getSuperAdminCommission(),
        getSuperAdminOverview().catch(() => null),
      ]);

      if (comm) {
        const rate = comm.commissionPercent || 12.0;
        setCommissionRate(rate);
        setInitialRate(rate);
      }
      setOverview(ovData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommissionData();
  }, [fetchCommissionData]);

  const handleSaveCommission = async () => {
    if (commissionRate < 0 || commissionRate > 50) {
      setError("Persentase komisi harus berada di antara 0% dan 50%.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await updateSuperAdminCommission(Number(commissionRate));
      setInitialRate(commissionRate);
      setSuccessMessage(`Tarif komisi platform berhasil diperbarui menjadi ${commissionRate}%.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const platformCut = Math.round((simulationAmount * commissionRate) / 100);
  const ownerCut = simulationAmount - platformCut;
  const isChanged = commissionRate !== initialRate;

  return (
    <div className="space-y-8 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Konfigurasi Komisi &amp; Bagi Hasil
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Atur persentase tarif bagi hasil platform WorkNest untuk setiap transaksi pemesanan ruangan secara terpusat dan real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchCommissionData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#006370]" : ""}`} />
            <span>Perbarui</span>
          </button>
          <button
            type="button"
            onClick={handleSaveCommission}
            disabled={saving || !isChanged}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-bold rounded-xs shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              TARIF KOMISI AKTIF
            </span>
            <TicketPercent className="w-4 h-4 text-[#006370]" />
          </div>
          <div className="text-3xl font-bold text-[#006370] font-mono">
            {commissionRate}%
          </div>
          <p className="text-[11px] text-slate-500">
            Diterapkan ke seluruh transaksi
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              TOTAL KOMISI TERKUMPUL
            </span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {formatRupiah(overview?.platformProfit || 0)}
          </div>
          <p className="text-[11px] text-slate-500">
            Pendapatan bersih platform
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              HAK BERSIH MITRA (PAYOUT)
            </span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {formatRupiah(overview?.totalOwnersPayout || 0)}
          </div>
          <p className="text-[11px] text-slate-500">
            {100 - commissionRate}% bagian mitra space owner
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              SETTLEMENT GATEWAY
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            Midtrans Otomatis
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            Clearance instan per reservasi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <h2 className="font-serif text-lg font-bold text-slate-900">
                Pengaturan Tarif Persentase
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sesuaikan besaran persentase bagi hasil platform. Perubahan akan langsung berlaku untuk seluruh reservasi baru.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Persentase Komisi Platform (%)
                </label>
                <span className="text-lg font-bold font-mono text-[#006370]">
                  {commissionRate}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                className="w-full accent-[#006370] cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0% (Bebas Biaya)</span>
                <span>12% (Standar)</span>
                <span>30% (Maksimal)</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Input Angka Manual
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#006370] rounded-xs text-xs font-bold font-mono text-slate-900 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400 font-mono">
                  %
                </span>
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-2">
                Pilihan Cepat (Preset):
              </span>
              <div className="flex flex-wrap gap-2">
                {[5, 8, 10, 12, 15, 20].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setCommissionRate(rate)}
                    className={`px-3 py-1.5 rounded-xs text-xs font-bold font-mono transition-all cursor-pointer ${
                      commissionRate === rate
                        ? "bg-[#006370] text-white shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            {isChanged && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xs text-xs text-green-800 flex items-center justify-between">
                <span>Perubahan belum disimpan ({initialRate}% → {commissionRate}%)</span>
                <button
                  type="button"
                  onClick={handleSaveCommission}
                  disabled={saving}
                  className="px-3 py-1 bg-[#006370] hover:bg-[#004f59] text-white rounded-xs font-bold text-xs cursor-pointer"
                >
                  Simpan Sekarang
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <h2 className="font-serif text-lg font-bold text-slate-900">
                Simulasi Bagi Hasil Transaksi
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Perkiraan pembagian dana antara platform WorkNest dan mitra space owner.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contoh Nilai Pemesanan (Rp)
              </label>
              <select
                value={simulationAmount}
                onChange={(e) => setSimulationAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-x[8px]l text-xs font-bold font-mono text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value={50000}>Rp 50.000 (Sewa Meja Flex Desk 1 Jam)</option>
                <option value={150000}>Rp 150.000 (Sewa Meja Seharian)</option>
                <option value={250000}>Rp 250.000 (Meeting Room 2 Jam)</option>
                <option value={500000}>Rp 500.000 (Private Office Sesi Siang)</option>
                <option value={1000000}>Rp 1.000.000 (Paket Rapat Full Day)</option>
                <option value={2500000}>Rp 2.500.000 (Reservasi Tim Bulanan)</option>
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-xs border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Nilai Transaksi Bruto (Member Bayar)</span>
                <strong className="font-mono text-slate-900 text-sm">
                  {formatRupiah(simulationAmount)}
                </strong>
              </div>

              <div className="flex items-center justify-between text-xs text-[#006370] pt-2 border-t border-slate-200/60">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#006370]" />
                  <span>Komisi Platform WorkNest ({commissionRate}%)</span>
                </span>
                <strong className="font-mono text-base">
                  {formatRupiah(platformCut)}
                </strong>
              </div>

              <div className="flex items-center justify-between text-xs text-emerald-800 pt-2 border-t border-slate-200/60">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Hak Bersih Mitra Owner ({100 - commissionRate}%)</span>
                </span>
                <strong className="font-mono text-base">
                  {formatRupiah(ownerCut)}
                </strong>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Mitra: {100 - commissionRate}%</span>
                <span>Platform: {commissionRate}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${100 - commissionRate}%` }}
                  className="bg-emerald-500 h-full transition-all"
                />
                <div
                  style={{ width: `${commissionRate}%` }}
                  className="bg-[#006370] h-full transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Mekanisme Bagi Hasil &amp; Pembayaran Platform
          </h2>
          <p className="text-xs text-slate-500">
            Alur otomatis settlement dari pembayaran member hingga pencairan dana ke rekening mitra venue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xs bg-slate-50/70 border border-slate-100 space-y-2">
            <div className="w-7 h-7 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-xs">Penerimaan Pembayaran</h3>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Member membayar reservasi melalui gateway resmi (QRIS, BCA VA, Mandiri, dll). Midtrans memproses pembayaran secara instan 24/7.
            </p>
          </div>

          <div className="p-4 rounded-xs bg-slate-50/70 border border-slate-100 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#E6F4F2] text-[#006370] flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-xs">Pemisahan Komisi Otomatis</h3>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Sistem secara otomatis menghitung potongan komisi {commissionRate}% untuk platform dan mencatat sisa {100 - commissionRate}% sebagai hak mitra.
            </p>
          </div>

          <div className="p-4 rounded-xs bg-slate-50/70 border border-slate-100 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#E6F4F2] text-[#006370] flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-xs">Settlement &amp; Payout Mitra</h3>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Mitra space owner dapat melihat akumulasi saldo bersih dan melakukan pencairan dana (disbursement) langsung ke rekening bank mereka.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
