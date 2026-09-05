"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";

export default function OwnerSpacesPage() {
  const { user } = useAuth();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [namaSpace, setNamaSpace] = useState("");
  const [tipe, setTipe] = useState<SpaceType>("desk");
  const [kapasitas, setKapasitas] = useState<number>(1);
  const [hargaPerJam, setHargaPerJam] = useState<number>(20000);
  const [deskripsi, setDeskripsi] = useState("");
  const [foto, setFoto] = useState("");

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

  const filteredSpaces = useMemo(() => {
    return spaces.filter((sp) => {
      const matchQuery =
        sp.namaSpace.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sp.deskripsi && sp.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTab = activeTab === "all" || sp.tipe === activeTab;
      return matchQuery && matchTab;
    });
  }, [spaces, searchQuery, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inventaris & Tarif Ruangan
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Kelola workstation, ruang rapat, kapasitas kursi, dan tarif sewa per jam.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchSpaces}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Ruangan</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-emerald-800 text-xs shadow-2xs">
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

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100/80 rounded-lg w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({spaces.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("desk")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "desk"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hot Desk ({spaces.filter((s) => s.tipe === "desk").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("meeting_room")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "meeting_room"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Meeting Room ({spaces.filter((s) => s.tipe === "meeting_room").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("private_office")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "private_office"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Private Office ({spaces.filter((s) => s.tipe === "private_office").length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau fasilitas..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md text-xs cursor-pointer ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs cursor-pointer ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse shadow-2xs">
              <div className="h-44 bg-slate-100" />
              <div className="p-4 space-y-2.5">
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-6 bg-slate-200 rounded w-1/2 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSpaces.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSpaces.map((sp) => (
              <div
                key={sp.id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={sp.foto || "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=600&q=80"}
                      alt={sp.namaSpace}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-200 bg-white/95 text-slate-800 shadow-2xs backdrop-blur-xs">
                        {getTypeLabel(sp.tipe)}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-slate-900/90 text-white backdrop-blur-xs px-2.5 py-1 rounded-md text-xs font-mono font-bold shadow-2xs">
                      {formatRupiah(sp.hargaPerJam)}/jam
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight line-clamp-1">
                      {sp.namaSpace}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
                      {sp.deskripsi || "Fasilitas lengkap dengan koneksi internet cepat, stopkontak, dan pendingin ruangan."}
                    </p>

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Kapasitas {sp.kapasitas} Orang</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 font-mono text-[11px]">ID #{sp.id}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(sp)}
                    className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(sp)}
                    className="py-1.5 px-3 bg-slate-50 hover:bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Ruangan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Kapasitas</th>
                    <th className="py-3 px-4">Tarif Sewa</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSpaces.map((sp) => (
                    <tr key={sp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            <img
                              src={sp.foto || "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=200&q=80"}
                              alt={sp.namaSpace}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{sp.namaSpace}</p>
                            <p className="text-[11px] text-slate-400 font-mono">#{sp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-800">
                          {getTypeLabel(sp.tipe)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {sp.kapasitas} Orang
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatRupiah(sp.hargaPerJam)}/jam
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sp)}
                          className="px-2.5 py-1 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-all inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(sp)}
                          className="px-2.5 py-1 hover:bg-rose-50 text-rose-600 rounded-lg border border-rose-200 transition-all inline-flex items-center gap-1 font-semibold cursor-pointer"
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
          </div>
        )
      ) : (
        <div className="w-full p-16 bg-white rounded-xl border border-slate-200/90 text-center shadow-2xs flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Ruangan</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery ? "Tidak ditemukan ruangan sesuai kata kunci pencarian." : "Tambahkan unit workstation atau ruang rapat pertama untuk mulai menerima reservasi."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
          >
            Tambah Ruangan Sekarang
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {editingSpace ? "Edit Rincian Ruangan" : "Tambah Ruangan Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Lengkapi parameter ruangan untuk publikasi katalog
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
                  Nama Ruangan
                </label>
                <input
                  type="text"
                  required
                  value={namaSpace}
                  onChange={(e) => setNamaSpace(e.target.value)}
                  placeholder="Contoh: Dedicated Desk A-01"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kategori Ruangan
                  </label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as SpaceType)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none cursor-pointer transition-all"
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
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none transition-all font-mono"
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
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs font-mono text-slate-900 focus:outline-none transition-all"
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
                  placeholder="Fasilitas proyektor 4K, smart TV, whiteboard, AC, port daya..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                />
              </div>

              <div>
                <ImageUploader
                  value={foto}
                  onChange={(val) => setFoto(val || "")}
                  label="Upload Foto Ruangan (File Lokal)"
                  helperText="Format gambar PNG, JPG, WebP. Tersimpan otomatis di sistem."
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
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
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Ruangan Ini?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>{deleteTarget.namaSpace}</strong>? Data ruangan yang dihapus tidak dapat dipulihkan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
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
