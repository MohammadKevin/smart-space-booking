"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getMyDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getMySpaces,
  Discount,
  Space,
  CreateDiscountDto,
  UpdateDiscountDto,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  TicketPercent,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Search,
  Building2,
  Download,
  TrendingUp,
  DollarSign,
  Zap,
} from "lucide-react";

export default function OwnerDiscountsPage() {
  const { user } = useAuth();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"all" | "active" | "scheduled" | "expired">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [yieldAutomation, setYieldAutomation] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [namaDiskon, setNamaDiskon] = useState("");
  const [kodeDiskon, setKodeDiskon] = useState("");
  const [persentaseDiskon, setPersentaseDiskon] = useState<number>(20);
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [spaceId, setSpaceId] = useState<number | "">("");

  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchDiscountsAndSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [discData, spacesData] = await Promise.all([
        getMyDiscounts().catch(() => []),
        getMySpaces().catch(() => []),
      ]);
      setDiscounts(Array.isArray(discData) ? discData : []);
      setSpaces(Array.isArray(spacesData) ? spacesData : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscountsAndSpaces();
  }, [fetchDiscountsAndSpaces]);

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreate = () => {
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    setEditingDiscount(null);
    setNamaDiskon("");
    setKodeDiskon("");
    setPersentaseDiskon(20);
    setTanggalAwal(today);
    setTanggalAkhir(nextMonth);
    setSpaceId("");
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (d: Discount) => {
    setEditingDiscount(d);
    setNamaDiskon(d.namaDiskon);
    setKodeDiskon(d.kodeDiskon || "");
    setPersentaseDiskon(d.persentaseDiskon);
    setTanggalAwal(d.tanggalAwal ? d.tanggalAwal.split("T")[0] : "");
    setTanggalAkhir(d.tanggalAkhir ? d.tanggalAkhir.split("T")[0] : "");
    setSpaceId(d.spaceId || "");
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const dto: CreateDiscountDto = {
      namaDiskon,
      kodeDiskon: kodeDiskon.toUpperCase().trim(),
      persentaseDiskon: Number(persentaseDiskon),
      tanggalAwal: new Date(tanggalAwal).toISOString(),
      tanggalAkhir: new Date(tanggalAkhir).toISOString(),
      spaceId: spaceId ? Number(spaceId) : undefined,
    };

    try {
      if (editingDiscount) {
        await updateDiscount(editingDiscount.id, dto as UpdateDiscountDto);
        setActionSuccess(`Kode promo ${dto.kodeDiskon} berhasil diperbarui.`);
      } else {
        await createDiscount(dto);
        setActionSuccess(`Kode promo ${dto.kodeDiskon} berhasil diterbitkan.`);
      }
      setModalOpen(false);
      fetchDiscountsAndSpaces();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDiscount(deleteTarget.id);
      setActionSuccess(`Kode promo ${deleteTarget.kodeDiskon} berhasil dihapus.`);
      setDeleteTarget(null);
      fetchDiscountsAndSpaces();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const getDiscountStatus = (d: Discount) => {
    const now = new Date();
    const start = new Date(d.tanggalAwal);
    const end = new Date(d.tanggalAkhir);

    if (now < start) {
      return { label: "Terjadwal", color: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (now > end) {
      return { label: "Berakhir", color: "bg-slate-100 text-slate-500 border-slate-200" };
    }
    return { label: "Aktif", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  };

  const filteredDiscounts = useMemo(() => {
    let result = discounts;

    const now = new Date();
    if (activeTab === "active") {
      result = result.filter((d) => {
        const start = new Date(d.tanggalAwal);
        const end = new Date(d.tanggalAkhir);
        return now >= start && now <= end;
      });
    } else if (activeTab === "scheduled") {
      result = result.filter((d) => new Date(d.tanggalAwal) > now);
    } else if (activeTab === "expired") {
      result = result.filter((d) => new Date(d.tanggalAkhir) < now);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          (d.kodeDiskon || "").toLowerCase().includes(q) ||
          d.namaDiskon.toLowerCase().includes(q) ||
          (d.space?.namaSpace || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [discounts, activeTab, searchQuery]);

  const counts = useMemo(() => {
    const now = new Date();
    const active = discounts.filter((d) => {
      const start = new Date(d.tanggalAwal);
      const end = new Date(d.tanggalAkhir);
      return now >= start && now <= end;
    }).length;
    const scheduled = discounts.filter((d) => new Date(d.tanggalAwal) > now).length;
    const expired = discounts.filter((d) => new Date(d.tanggalAkhir) < now).length;
    return {
      all: discounts.length,
      active,
      scheduled,
      expired,
    };
  }, [discounts]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>WORKSPACE OWNER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Program Promo &amp; Voucher
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Diskon &amp; Kode Promo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola voucher diskon, kode promo khusus member, dan program loyalitas reservasi ruangan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchDiscountsAndSpaces}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#006370]" : "text-slate-500"}`} />
            <span>Perbarui</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xs bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Kode Promo</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xs bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold p-0.5 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xs bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold p-0.5 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xs p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              VOUCHER AKTIF
            </span>
            <div className="w-7 h-7 rounded-xs bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
              <TicketPercent className="w-4 h-4 text-[#006370]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {counts.active}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Kode promo siap digunakan
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TERJADWAL
            </span>
            <div className="w-7 h-7 rounded-xs bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {counts.scheduled}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Menunggu periode berlaku
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              KADALUARSA
            </span>
            <div className="w-7 h-7 rounded-xs bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {counts.expired}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Periode promo telah usai
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL KAMPANYE
            </span>
            <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#E6F4F2] text-[#006370] border border-[#BCE3DE]">
              {discounts.length} Promo
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {discounts.length}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Keseluruhan arsip voucher
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold w-full sm:w-auto">
          {[
            { id: "all", label: `Semua (${counts.all})` },
            { id: "active", label: `Aktif (${counts.active})` },
            { id: "scheduled", label: `Terjadwal (${counts.scheduled})` },
            { id: "expired", label: `Berakhir (${counts.expired})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#006370] text-white font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau nama promo..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xs text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006370] transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-xs border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#006370]" />
            <span>Memuat data voucher promo...</span>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-xs bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <TicketPercent className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Belum Ada Promo Voucher</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? "Tidak ada voucher yang cocok dengan filter pencarian Anda."
                  : "Mulai buat voucher diskon pertama untuk meningkatkan okupansi meja dan ruangan Anda."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xs bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Kode Promo Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">KODE &amp; KAMPANYE</th>
                  <th className="py-3 px-4">BESARAN DISKON</th>
                  <th className="py-3 px-4">RUANGAN BERLAKU</th>
                  <th className="py-3 px-4">PERIODE BERLAKU</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDiscounts.map((d) => {
                  const status = getDiscountStatus(d);
                  const isCopied = copiedCode === d.kodeDiskon;
                  const rawStart = d.tanggalAwal ? d.tanggalAwal.split("T")[0] : "-";
                  const rawEnd = d.tanggalAkhir ? d.tanggalAkhir.split("T")[0] : "-";

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded-xs border border-slate-200">
                              {d.kodeDiskon}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(d.kodeDiskon || "")}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Salin Kode"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">
                            {d.namaDiskon}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 font-mono text-sm">
                          {d.persentaseDiskon}%
                        </p>
                        <span className="text-[10px] text-slate-400">Potongan Harga</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">
                            {d.space ? d.space.namaSpace : "Semua Ruangan Venue"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <p className="font-medium text-[11px] text-slate-900">
                          {rawStart} &ndash; {rawEnd}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[10px] font-bold border ${status.color}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{status.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(d)}
                            className="px-2.5 py-1 rounded-xs border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(d)}
                            className="p-1 rounded-xs hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center">
                  <TicketPercent className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  {editingDiscount ? "Ubah Kode Promo" : "Terbitkan Kode Promo Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xs bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDiscount} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-800">
                  Nama Kampanye / Promo *
                </label>
                <input
                  type="text"
                  required
                  value={namaDiskon}
                  onChange={(e) => setNamaDiskon(e.target.value)}
                  placeholder="Contoh: Early Bird Workspace 20%"
                  className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xs text-slate-900 focus:outline-none focus:border-[#006370]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-800">
                  Kode Voucher (HURUF BESAR) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={kodeDiskon}
                    onChange={(e) => setKodeDiskon(e.target.value.toUpperCase())}
                    placeholder="Contoh: WORKNEST20"
                    className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#006370]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rand = `WN${Math.floor(100 + Math.random() * 900)}`;
                      setKodeDiskon(rand);
                    }}
                    className="px-3 py-2 rounded-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shrink-0 cursor-pointer border border-slate-200"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-800">
                  Persentase Diskon (%) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={persentaseDiskon}
                  onChange={(e) => setPersentaseDiskon(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#006370]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-800">
                    Berlaku Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalAwal}
                    onChange={(e) => setTanggalAwal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xs text-slate-800 focus:outline-none focus:border-[#006370]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-800">
                    Berlaku Hingga *
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalAkhir}
                    onChange={(e) => setTanggalAkhir(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xs text-slate-800 focus:outline-none focus:border-[#006370]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-800">
                  Penerapan Ruangan (Opsional)
                </label>
                <select
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xs text-slate-800 focus:outline-none focus:border-[#006370] cursor-pointer"
                >
                  <option value="">Semua Ruangan (All Spaces)</option>
                  {spaces.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.namaSpace} ({sp.tipe})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xs border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xs bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingDiscount ? "Simpan Perubahan" : "Terbitkan Promo"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xs bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base font-bold text-slate-900">Hapus Kode Promo?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus kode promo{" "}
                <strong className="text-slate-800 font-mono">{deleteTarget.kodeDiskon}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xs border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xs bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
