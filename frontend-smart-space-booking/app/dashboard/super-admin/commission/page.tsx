"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  getSuperAdminCommission,
  updateSuperAdminCommission,
  getSuperAdminOverview,
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
  Calculator,
  ShieldCheck,
  Coins,
  ArrowRight,
} from "lucide-react";

export default function SuperAdminCommissionPage() {
  const [commissionRate, setCommissionRate] = useState<number>(5.0);
  const [defaultEnvRate, setDefaultEnvRate] = useState<number>(5.0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [totalGmv, setTotalGmv] = useState<number>(0);
  const [simulationAmount, setSimulationAmount] = useState<number>(100000);

  const fetchCommissionData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [comm, overview] = await Promise.all([
        getSuperAdminCommission(),
        getSuperAdminOverview().catch(() => ({ totalGmv: 0 })),
      ]);

      if (comm) {
        setCommissionRate(comm.commissionPercent);
        setDefaultEnvRate(comm.defaultEnvPercent);
      }
      if (overview) {
        setTotalGmv(overview.totalGmv || 0);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommissionData();
  }, [fetchCommissionData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    if (commissionRate < 0 || commissionRate > 50) {
      setError("Persentase komisi harus berada di antara 0% hingga 50%.");
      setSaving(false);
      return;
    }

    try {
      const res = await updateSuperAdminCommission(commissionRate);
      setSuccessMessage(res.message || `Persentase komisi berhasil diperbarui ke ${commissionRate}%.`);
      await fetchCommissionData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const calculatedPlatformFee = (simulationAmount * commissionRate) / 100;
  const calculatedOwnerPayout = simulationAmount - calculatedPlatformFee;
  const projectedPlatformEarnings = (totalGmv * commissionRate) / 100;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Pengaturan Komisi Platform
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Atur besaran persentase bagi hasil dari setiap transaksi reservasi yang diproses di WorkNest.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchCommissionData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-emerald-800 text-xs shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Form: Rate Setting */}
        <div className="md:col-span-7 bg-white rounded-xl border border-slate-200/90 p-6 space-y-5 shadow-2xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tarif Komisi Transaksi</h2>
              <p className="text-xs text-slate-500">Perubahan berlaku instan ke seluruh transaksi baru.</p>
            </div>
            <TicketPercent className="w-4 h-4 text-slate-400" />
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Persentase Komisi (%)</label>
                <span className="font-mono font-extrabold text-xl text-slate-900 bg-slate-100 px-3 py-0.5 rounded-lg border border-slate-200">
                  {commissionRate}%
                </span>
              </div>

              {/* Range Slider */}
              <input
                type="range"
                min={0}
                max={30}
                step={0.5}
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% (Bebas Komisi)</span>
                <span>5% (Rekomendasi)</span>
                <span>10% (Standar)</span>
                <span>30%</span>
              </div>
            </div>

            {/* Direct Number Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Atau Masukkan Nilai Angka Persen</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.1}
                  required
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition-all"
                />
                <span className="absolute right-3.5 top-2 font-bold text-xs text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Nilai default dari konfigurasi server: <strong>{defaultEnvRate}%</strong>
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || loading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menerapkan Komisi...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan & Terapkan Komisi ({commissionRate}%)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Real-time Split Simulator */}
        <div className="md:col-span-5 bg-white rounded-xl border border-slate-200/90 p-6 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Simulasi Bagi Hasil</h2>
                <p className="text-xs text-slate-500">Kalkulasi pembagian uang real-time.</p>
              </div>
              <Calculator className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-600">Simulasi Nilai Transaksi Sewa (IDR)</label>
              <input
                type="number"
                step={10000}
                min={10000}
                value={simulationAmount}
                onChange={(e) => setSimulationAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200/70 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span>💰 Keuntungan Platform Anda ({commissionRate}%)</span>
                  <span className="font-mono font-bold">{formatRupiah(calculatedPlatformFee)}</span>
                </div>
                <p className="text-[10px] text-emerald-700">Masuk otomatis ke saldo keuntungan platform.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>🏢 Payout Bersih Space Owner ({100 - commissionRate}%)</span>
                  <span className="font-mono font-bold">{formatRupiah(calculatedOwnerPayout)}</span>
                </div>
                <p className="text-[10px] text-slate-500">Saldo bersih yang diterima pemilik coworking.</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60 text-xs space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Proyeksi Total Keuntungan</span>
            <p className="text-base font-extrabold font-mono text-slate-900">{formatRupiah(projectedPlatformEarnings)}</p>
            <p className="text-[10px] text-slate-400">Dari total GMV platform saat ini ({formatRupiah(totalGmv)})</p>
          </div>
        </div>
      </div>
    </div>
  );
}
