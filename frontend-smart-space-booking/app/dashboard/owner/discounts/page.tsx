"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  Discount,
  CreateDiscountDto,
  UpdateDiscountDto,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  TicketPercent,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Calendar,
  Tag,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Search,
  Sparkles,
  Clock,
} from "lucide-react";

export default function OwnerDiscountsPage() {
  const { user } = useAuth();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [namaDiskon, setNamaDiskon] = useState("");
  const [kodeDiskon, setKodeDiskon] = useState("");
  const [persentaseDiskon, setPersentaseDiskon] = useState<number>(20);
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Copied state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDiscounts();
      setDiscounts(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

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
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!namaDiskon.trim()) {
      setFormError("Nama promo wajib diisi");
      return;
    }
    if (persentaseDiskon < 1 || persentaseDiskon > 100) {
      setFormError("Persentase diskon harus antara 1% hingga 100%");
      return;
    }
    if (!tanggalAwal || !tanggalAkhir) {
      setFormError("Tanggal mulai dan berakhir wajib diisi");
      return;
    }

    setFormLoading(true);
    try {
      const cleanCode = kodeDiskon.trim().toUpperCase() || undefined;
      const startIso = new Date(tanggalAwal).toISOString();
      const endIso = new Date(tanggalAkhir + "T23:59:59.000Z").toISOString();

      if (editingDiscount) {
        const dto: UpdateDiscountDto = {
          namaDiskon: namaDiskon.trim(),
          kodeDiskon: cleanCode,
          persentaseDiskon: Number(persentaseDiskon),
          tanggalAwal: startIso,
          tanggalAkhir: endIso,
        };
        await updateDiscount(editingDiscount.id, dto);
        setActionSuccess(`Kode promo "${namaDiskon}" berhasil diperbarui.`);
      } else {
        const dto: CreateDiscountDto = {
          namaDiskon: namaDiskon.trim(),
          kodeDiskon: cleanCode,
          persentaseDiskon: Number(persentaseDiskon),
          tanggalAwal: startIso,
          tanggalAkhir: endIso,
        };
        await createDiscount(dto);
        setActionSuccess(`Kode promo "${namaDiskon}" berhasil dibuat.`);
      }

      setModalOpen(false);
      await fetchDiscounts();
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDiscount(deleteTarget.id);
      setActionSuccess(`Kode promo "${deleteTarget.namaDiskon}" berhasil dihapus.`);
      setDeleteTarget(null);
      await fetchDiscounts();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // Check promo validity
  const getValidityStatus = (startStr: string, endStr: string) => {
    const now = new Date();
    const start = new Date(startStr);
    const end = new Date(endStr);

    if (now < start) {
      return {
        label: "Mendatang",
        className: "bg-amber-50 text-amber-800 border-amber-200",
      };
    }
    if (now > end) {
      return {
        label: "Kedaluwarsa",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
    }
    return {
      label: "Aktif",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
  };

  // Filtered discounts
  const filteredDiscounts = useMemo(() => {
    return discounts.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchName = d.namaDiskon.toLowerCase().includes(q);
      const matchCode = (d.kodeDiskon || "").toLowerCase().includes(q);
      return matchName || matchCode;
    });
  }, [discounts, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <TicketPercent className="w-3.5 h-3.5 text-cyan-600" />
            <span>Manajemen Promo & Kupon Diskon</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kode Promo & Diskon Spesial
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Buat kupon potongan harga untuk menarik member baru, atur persentase diskon, dan tetapkan periode aktif voucher.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            type="button"
            onClick={fetchDiscounts}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-cyan-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Promo Baru</span>
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs shadow-2xs">
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

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama program promo atau kode kupon..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total: <span className="font-mono text-cyan-700 font-bold">{filteredDiscounts.length}</span> Voucher
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="p-16 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-3 font-medium">Memuat kode promo...</p>
        </div>
      ) : filteredDiscounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDiscounts.map((d) => {
            const startDate = d.tanggalAwal ? d.tanggalAwal.split("T")[0] : "-";
            const endDate = d.tanggalAkhir ? d.tanggalAkhir.split("T")[0] : "-";
            const validity = getValidityStatus(d.tanggalAwal, d.tanggalAkhir);

            return (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-cyan-300 transition-all shadow-xs hover:shadow-md p-5 flex flex-col justify-between space-y-4 relative group"
              >
                <div className="space-y-3">
                  {/* Top Status & Discount Percentage */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border ${validity.className}`}
                    >
                      {validity.label}
                    </span>
                    <div className="px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-extrabold text-sm">
                      {d.persentaseDiskon}% OFF
                    </div>
                  </div>

                  {/* Promo Name */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {d.namaDiskon}
                    </h3>
                  </div>

                  {/* Coupon Code Pill with Copy Action */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-cyan-600" />
                      <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                        {d.kodeDiskon || "(Otomatis)"}
                      </span>
                    </div>
                    {d.kodeDiskon && (
                      <button
                        type="button"
                        onClick={() => handleCopyCode(d.kodeDiskon!)}
                        className="p-1 rounded text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
                        title="Salin Kode Kupon"
                      >
                        {copiedCode === d.kodeDiskon ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Date Period */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{startDate} s/d {endDate}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(d)}
                    className="py-1.5 px-3 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(d)}
                    className="py-1.5 px-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-rose-600 text-xs font-semibold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full p-12 sm:p-16 bg-white rounded-xl border border-slate-200 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto border border-cyan-200">
            <TicketPercent className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-slate-900">Belum Ada Kode Promo</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery ? "Tidak ditemukan kode promo dengan kata kunci tersebut." : "Buat voucher potongan harga pertama untuk menarik lebih banyak member memesan ruangan."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-xs shadow-cyan-600/30 cursor-pointer"
          >
            Buat Promo Sekarang
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
                  <TicketPercent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {editingDiscount ? "Edit Kode Promo" : "Buat Kode Promo Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Atur besaran persentase dan periode berlaku kupon
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Nama Program Promo
                </label>
                <input
                  type="text"
                  required
                  value={namaDiskon}
                  onChange={(e) => setNamaDiskon(e.target.value)}
                  placeholder="Contoh: Promo Ramadhan 2026"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kode Kupon Voucher
                  </label>
                  <input
                    type="text"
                    value={kodeDiskon}
                    onChange={(e) => setKodeDiskon(e.target.value.toUpperCase())}
                    placeholder="Contoh: HEMAT20"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 font-mono font-bold focus:outline-none transition-all uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Potongan Diskon (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={persentaseDiskon}
                    onChange={(e) => setPersentaseDiskon(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 font-mono focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalAwal}
                    onChange={(e) => setTanggalAwal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalAkhir}
                    onChange={(e) => setTanggalAkhir(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs shadow-cyan-600/30 transition-all cursor-pointer"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Simpan Promo</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Kode Promo?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus voucher <strong>{deleteTarget.namaDiskon}</strong>? Member tidak akan dapat menggunakan kupon ini lagi.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Ya, Hapus</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
