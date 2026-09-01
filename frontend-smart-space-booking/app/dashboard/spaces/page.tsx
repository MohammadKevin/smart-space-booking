"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getMySpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  Space,
  SpaceType,
  CreateSpaceDto,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/components/SpaceCard";
import {
  Building,
  Plus,
  Trash2,
  Edit,
  Users,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
} from "lucide-react";

function SpaceManagementContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [namaSpace, setNamaSpace] = useState("");
  const [tipe, setTipe] = useState<SpaceType>("desk");
  const [hargaPerJam, setHargaPerJam] = useState<number>(25000);
  const [kapasitas, setKapasitas] = useState<number>(1);
  const [foto, setFoto] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Space | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMySpaces();
      setSpaces(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login?redirect=/dashboard/spaces");
      } else {
        const role = user?.role?.toLowerCase();
        if (role !== "admin_space" && role !== "owner") {
          // If member, redirect to catalog
          router.push("/spaces");
        } else {
          fetchSpaces();
        }
      }
    }
  }, [authLoading, isAuthenticated, user, router, fetchSpaces]);

  const handleOpenCreate = () => {
    setEditingSpaceId(null);
    setNamaSpace("");
    setTipe("desk");
    setHargaPerJam(25000);
    setKapasitas(1);
    setFoto("https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80");
    setDeskripsi("");
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (sp: Space) => {
    setEditingSpaceId(sp.id);
    setNamaSpace(sp.namaSpace);
    setTipe(sp.tipe);
    setHargaPerJam(sp.hargaPerJam);
    setKapasitas(sp.kapasitas);
    setFoto(sp.foto || "");
    setDeskripsi(sp.deskripsi || "");
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!namaSpace.trim()) {
      setFormError("Nama ruangan wajib diisi");
      return;
    }
    if (hargaPerJam <= 0) {
      setFormError("Harga per jam harus lebih dari 0");
      return;
    }
    if (kapasitas <= 0) {
      setFormError("Kapasitas minimal 1 orang");
      return;
    }

    setFormLoading(true);
    try {
      const payload: CreateSpaceDto = {
        namaSpace: namaSpace.trim(),
        tipe,
        hargaPerJam: Number(hargaPerJam),
        kapasitas: Number(kapasitas),
        foto: foto.trim() || undefined,
        deskripsi: deskripsi.trim() || undefined,
      };

      if (editingSpaceId) {
        await updateSpace(editingSpaceId, payload);
        setActionSuccess(`Ruangan "${namaSpace}" berhasil diperbarui.`);
      } else {
        await createSpace(payload);
        setActionSuccess(`Ruangan "${namaSpace}" berhasil ditambahkan.`);
      }

      setModalOpen(false);
      await fetchSpaces();
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
      await deleteSpace(deleteTarget.id);
      setActionSuccess(`Ruangan "${deleteTarget.namaSpace}" berhasil dihapus.`);
      setDeleteTarget(null);
      await fetchSpaces();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Building className="w-3.5 h-3.5 text-sky-500" />
            <span>Dashboard Space Owner</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Kelola Ruangan & Workstation
          </h1>
          <p className="text-sm text-slate-600">
            Tambah, perbarui tarif, atau kelola unit workspace milik coworking space Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSpaces}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm shadow-sky-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Ruangan Baru</span>
          </button>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-sm text-emerald-700">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <h4 className="font-bold">Terjadi Kesalahan</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Space Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 h-72 animate-pulse" />
          ))}
        </div>
      ) : spaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((sp) => (
            <div
              key={sp.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-[16/9] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sp.foto || "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80"}
                  alt={sp.namaSpace}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-sky-700 border border-sky-200">
                    {sp.tipe === "desk" ? "Hot Desk" : sp.tipe === "meeting_room" ? "Meeting Room" : "Private Office"}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-lg">{sp.namaSpace}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {sp.deskripsi || "Tidak ada deskripsi tambahan."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-sky-500" />
                    <span>{sp.kapasitas} Orang</span>
                  </div>
                  <div className="font-black text-slate-900 text-sm">
                    {formatRupiah(sp.hargaPerJam)}<span className="text-xs font-normal text-slate-500">/jam</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(sp)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(sp)}
                    className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                    title="Hapus Ruangan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <Building className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Belum Ada Ruangan</h3>
            <p className="text-xs text-slate-500">
              Mulai daftarkan meja kerja atau ruang rapat untuk disewakan ke member.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Ruangan Sekarang</span>
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingSpaceId ? "Edit Data Ruangan" : "Tambah Ruangan / Workstation"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nama Ruangan
                </label>
                <input
                  type="text"
                  required
                  value={namaSpace}
                  onChange={(e) => setNamaSpace(e.target.value)}
                  placeholder="e.g. Dedicated Hot Desk #04"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tipe Ruangan
                  </label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as SpaceType)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10 cursor-pointer"
                  >
                    <option value="desk">Hot Desk / Workstation</option>
                    <option value="meeting_room">Meeting Room</option>
                    <option value="private_office">Private Office</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Kapasitas (Orang)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={kapasitas}
                    onChange={(e) => setKapasitas(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tarif Sewa Per Jam (IDR)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={hargaPerJam}
                  onChange={(e) => setHargaPerJam(parseInt(e.target.value, 10) || 0)}
                  placeholder="25000"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  URL Foto Ruangan
                </label>
                <input
                  type="url"
                  value={foto}
                  onChange={(e) => setFoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Deskripsi & Fasilitas
                </label>
                <textarea
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Sebutkan fasilitas seperti High-Speed Wifi, Smart TV 4K, stopkontak dedicated..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {formLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{editingSpaceId ? "Simpan Perubahan" : "Tambah Ruangan"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Ruangan Ini?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus <strong>{deleteTarget.namaSpace}</strong>? Tindakan ini tidak dapat diurungkan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5"
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

export default function SpaceManagementPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-slate-500">Memuat dashboard...</div>}>
      <SpaceManagementContent />
    </Suspense>
  );
}
