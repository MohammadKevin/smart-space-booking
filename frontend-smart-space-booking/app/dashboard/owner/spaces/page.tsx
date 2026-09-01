"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  getMySpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  Space,
  CreateSpaceDto,
  UpdateSpaceDto,
  SpaceType,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/components/SpaceCard";
import { ImageUploader } from "@/components/ImageUploader";
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Users,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
} from "lucide-react";

export default function OwnerSpacesPage() {
  const { user } = useAuth();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [namaSpace, setNamaSpace] = useState("");
  const [tipe, setTipe] = useState<SpaceType>("desk");
  const [kapasitas, setKapasitas] = useState<number>(1);
  const [hargaPerJam, setHargaPerJam] = useState<number>(20000);
  const [deskripsi, setDeskripsi] = useState("");
  const [foto, setFoto] = useState("");

  // Delete State
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
    fetchSpaces();
  }, [fetchSpaces]);

  const handleOpenCreate = () => {
    setEditingSpace(null);
    setNamaSpace("");
    setTipe("desk");
    setKapasitas(1);
    setHargaPerJam(25000);
    setDeskripsi("");
    setFoto("");
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (sp: Space) => {
    setEditingSpace(sp);
    setNamaSpace(sp.namaSpace);
    setTipe(sp.tipe as SpaceType);
    setKapasitas(sp.kapasitas);
    setHargaPerJam(sp.hargaPerJam);
    setDeskripsi(sp.deskripsi || "");
    setFoto(sp.foto || "");
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
    if (kapasitas < 1) {
      setFormError("Kapasitas minimal 1 orang");
      return;
    }
    if (hargaPerJam < 0) {
      setFormError("Tarif per jam tidak boleh negatif");
      return;
    }

    setFormLoading(true);
    try {
      if (editingSpace) {
        const dto: UpdateSpaceDto = {
          namaSpace: namaSpace.trim(),
          tipe,
          kapasitas: Number(kapasitas),
          hargaPerJam: Number(hargaPerJam),
          deskripsi: deskripsi.trim() || undefined,
          foto: foto.trim() || undefined,
        };
        await updateSpace(editingSpace.id, dto);
        setActionSuccess(`Ruangan "${namaSpace}" berhasil diperbarui.`);
      } else {
        const dto: CreateSpaceDto = {
          namaSpace: namaSpace.trim(),
          tipe,
          kapasitas: Number(kapasitas),
          hargaPerJam: Number(hargaPerJam),
          deskripsi: deskripsi.trim() || undefined,
          foto: foto.trim() || undefined,
        };
        await createSpace(dto);
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

  const getTypeLabel = (type: string) => {
    if (type === "desk") return "Hot Desk";
    if (type === "meeting_room") return "Meeting Room";
    return "Private Office";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            <span>Manajemen Inventaris Ruangan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Inventaris & Tarif Ruangan
          </h1>
          <p className="text-xs text-slate-500">
            Tambah unit baru, perbarui kapasitas, atau sesuaikan tarif sewa per jam untuk katalog publik.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSpaces}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Ruangan</span>
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="font-bold text-emerald-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Memuat daftar inventaris...</p>
          </div>
        ) : spaces.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Ruangan</th>
                  <th className="py-3 px-4">Tipe Kategori</th>
                  <th className="py-3 px-4">Kapasitas</th>
                  <th className="py-3 px-4">Tarif / Jam</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {spaces.map((sp) => (
                  <tr key={sp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sp.foto || "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=200&q=80"}
                            alt={sp.namaSpace}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{sp.namaSpace}</p>
                          <p className="text-[11px] text-slate-400">ID #{sp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {getTypeLabel(sp.tipe)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {sp.kapasitas} Orang
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {formatRupiah(sp.hargaPerJam)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sp)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded border border-slate-200 transition-colors inline-flex items-center gap-1 font-semibold"
                        title="Edit Ruangan"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(sp)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded border border-rose-200 transition-colors inline-flex items-center gap-1 font-semibold"
                        title="Hapus Ruangan"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center max-w-sm mx-auto space-y-3">
            <Building className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Belum Ada Ruangan</h3>
              <p className="text-xs text-slate-500">
                Tambahkan workstation atau ruang rapat pertama untuk mulai menerima pemesanan.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Tambah Ruangan Baru
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingSpace ? "Edit Rincian Ruangan" : "Tambah Ruangan Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
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
                  Nama Ruangan
                </label>
                <input
                  type="text"
                  required
                  value={namaSpace}
                  onChange={(e) => setNamaSpace(e.target.value)}
                  placeholder="Contoh: Meeting Room A - Executive"
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tipe Ruangan
                  </label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as SpaceType)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="desk">Hot Desk</option>
                    <option value="meeting_room">Meeting Room</option>
                    <option value="private_office">Private Office</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kapasitas (Orang)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={kapasitas}
                    onChange={(e) => setKapasitas(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tarif / Jam (IDR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    required
                    value={hargaPerJam}
                    onChange={(e) => setHargaPerJam(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Deskripsi & Fasilitas Ruangan
                </label>
                <textarea
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Deskripsikan fasilitas seperti proyektor, whiteboard, AC, port daya..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <ImageUploader
                  value={foto}
                  onChange={(val) => setFoto(val || "")}
                  label="Upload Foto Ruangan (File Lokal)"
                  helperText="Pilih file gambar dari komputer (PNG, JPG, WebP). File akan dienkode dan disimpan di database."
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Simpan Ruangan</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-xl">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Ruangan Ini?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus <strong>{deleteTarget.namaSpace}</strong>? Data ruangan yang telah dihapus tidak dapat dipulihkan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
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
