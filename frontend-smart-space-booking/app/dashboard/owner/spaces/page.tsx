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
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Info,
  Check,
} from "lucide-react";

export default function OwnerSpacesPage() {
  const { user } = useAuth();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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
        setActionSuccess(`Ruangan "${namaSpace}" berhasil ditambahkan ke inventaris.`);
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

  const getTypeBadge = (type: string) => {
    if (type === "desk") {
      return "bg-cyan-50 text-cyan-800 border-cyan-200";
    }
    if (type === "meeting_room") {
      return "bg-sky-50 text-sky-800 border-sky-200";
    }
    return "bg-blue-50 text-blue-800 border-blue-200";
  };

  // Filtered Spaces
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
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventaris & Tarif Ruangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Kelola unit workstation, atur kapasitas kursi, ubah tarif per jam, serta perbarui foto dan fasilitas ruangan untuk katalog publik.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            type="button"
            onClick={fetchSpaces}
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
            <span>Tambah Ruangan Baru</span>
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

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-white text-cyan-950 shadow-2xs border border-cyan-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({spaces.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("desk")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "desk"
                ? "bg-white text-cyan-950 shadow-2xs border border-cyan-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hot Desk ({spaces.filter((s) => s.tipe === "desk").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("meeting_room")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "meeting_room"
                ? "bg-white text-cyan-950 shadow-2xs border border-cyan-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Meeting Room ({spaces.filter((s) => s.tipe === "meeting_room").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("private_office")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "private_office"
                ? "bg-white text-cyan-950 shadow-2xs border border-cyan-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Private Office ({spaces.filter((s) => s.tipe === "private_office").length})
          </button>
        </div>

        {/* Search & View Mode Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau fasilitas..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md text-xs cursor-pointer ${
                viewMode === "grid" ? "bg-white text-cyan-700 shadow-2xs font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs cursor-pointer ${
                viewMode === "table" ? "bg-white text-cyan-700 shadow-2xs font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View (Grid vs Table) */}
      {loading ? (
        <div className="space-y-4">
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center shadow-xs flex flex-col items-center justify-center space-y-2.5">
            <Loader2 className="w-7 h-7 text-cyan-600 animate-spin" />
            <p className="text-xs font-bold text-slate-800">Menyinkronkan Inventaris Coworking...</p>
            <p className="text-[11px] text-slate-400">Mengambil data ruangan dan kapasitas unit terbaru.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse shadow-xs">
                <div className="h-44 bg-slate-200/70" />
                <div className="p-4 space-y-2.5">
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-6 bg-slate-200 rounded w-1/2 mt-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredSpaces.length > 0 ? (
        viewMode === "grid" ? (
          /* Grid View Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSpaces.map((sp) => (
              <div
                key={sp.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-cyan-300 transition-all shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail Image Header */}
                  <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sp.foto || "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=600&q=80"}
                      alt={sp.namaSpace}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-xs ${getTypeBadge(sp.tipe)}`}>
                        {getTypeLabel(sp.tipe)}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-xs font-mono font-bold text-slate-900 shadow-xs border border-slate-200">
                      {formatRupiah(sp.hargaPerJam)}/jam
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight line-clamp-1">
                      {sp.namaSpace}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
                      {sp.deskripsi || "Fasilitas lengkap: WiFi cepat, stopkontak, dan pendingin ruangan."}
                    </p>

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Kapasitas {sp.kapasitas} Orang</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 text-[11px]">ID #{sp.id}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(sp)}
                    className="py-2 px-3 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(sp)}
                    className="py-2 px-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-rose-600 text-xs font-semibold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Ruangan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Kapasitas</th>
                    <th className="py-3 px-4">Tarif Sewa / Jam</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSpaces.map((sp) => (
                    <tr key={sp.id} className="hover:bg-cyan-50/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={sp.foto || "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=200&q=80"}
                              alt={sp.namaSpace}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{sp.namaSpace}</p>
                            <p className="text-[11px] text-slate-400">ID #{sp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getTypeBadge(sp.tipe)}`}>
                          {getTypeLabel(sp.tipe)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {sp.kapasitas} Orang
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatRupiah(sp.hargaPerJam)}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sp)}
                          className="px-2.5 py-1.5 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 text-slate-600 rounded-lg border border-slate-200 transition-all inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(sp)}
                          className="px-2.5 py-1.5 hover:bg-rose-50 text-rose-600 rounded-lg border border-rose-200 transition-all inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        <div className="w-full p-12 sm:p-16 bg-white rounded-xl border border-slate-200 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto border border-cyan-200">
            <Building className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Ruangan yang Cocok</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery ? "Tidak ditemukan ruangan sesuai kata kunci pencarian." : "Tambahkan unit workstation atau ruang rapat pertama untuk mulai menerima reservasi."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-xs shadow-cyan-600/30 cursor-pointer"
          >
            Tambah Ruangan Sekarang
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {editingSpace ? "Edit Rincian Ruangan" : "Tambah Ruangan Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Lengkapi detail informasi untuk publikasi di katalog
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
                  placeholder="Contoh: Meeting Room A - Executive"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
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
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none cursor-pointer transition-all"
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
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
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
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs font-mono text-slate-900 focus:outline-none transition-all"
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
                  placeholder="Deskripsikan fasilitas seperti proyektor 4K, smart TV, whiteboard, AC, port daya..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                />
              </div>

              <div>
                <ImageUploader
                  value={foto}
                  onChange={(val) => setFoto(val || "")}
                  label="Upload Foto Ruangan (File Lokal)"
                  helperText="Pilih file gambar (PNG, JPG, WebP). File akan dienkode dan tersimpan rapi di sistem."
                />
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
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Ruangan Ini?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>{deleteTarget.namaSpace}</strong>? Data inventaris yang terhapus tidak dapat dipulihkan.
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

