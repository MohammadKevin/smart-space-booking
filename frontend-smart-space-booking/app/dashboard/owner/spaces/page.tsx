"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  getMySpaces,
  updateSpace,
  deleteSpace,
  Space,
  UpdateSpaceDto,
  SpaceType,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/components/SpaceCard";
import {
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
  Building,
} from "lucide-react";

export default function OwnerSpacesPage() {
  const { user } = useAuth();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editName, setEditName] = useState<string>("");
  const [editCapacity, setEditCapacity] = useState<number>(1);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Space | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMySpaces();
      setSpaces(data || []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const handleOpenEdit = (sp: Space) => {
    setEditingSpace(sp);
    setEditName(sp.namaSpace);
    setEditPrice(sp.hargaPerJam);
    setEditCapacity(sp.kapasitas);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpace) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const dto: UpdateSpaceDto = {
        namaSpace: editName.trim(),
        hargaPerJam: Number(editPrice),
        kapasitas: Number(editCapacity),
      };
      await updateSpace(editingSpace.id, dto);
      setActionSuccess(`Spesifikasi ruangan "${editName}" berhasil diperbarui.`);
      setEditingSpace(null);
      await fetchSpaces();
    } catch (err) {
      setEditError(getApiErrorMessage(err));
    } finally {
      setEditLoading(false);
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

  const filteredSpaces = useMemo(() => {
    return spaces.filter((sp) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        sp.namaSpace.toLowerCase().includes(q) ||
        (sp.deskripsi && sp.deskripsi.toLowerCase().includes(q));

      const matchType = typeFilter === "all" || sp.tipe === typeFilter;
      return matchSearch && matchType;
    });
  }, [spaces, searchQuery, typeFilter]);

  const getTypeLabel = (tipe: SpaceType) => {
    if (tipe === "meeting_room") return "Meeting Room";
    if (tipe === "private_office") return "Private Office";
    if (tipe === "desk") return "Dedicated Desk";
    return tipe;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>WORKSPACE OWNER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Direktori {spaces.length} Ruangan Terdaftar
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Inventaris &amp; Katalog Ruangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola katalog unit ruang kerja, tarif per jam, kapasitas kursi, dan ketersediaan publik bagi calon member.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchSpaces}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#006370]" : ""}`} />
            <span>Perbarui</span>
          </button>
          <Link
            href="/dashboard/owner/spaces/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Ruangan Baru</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xs text-xs font-medium shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs font-medium shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xs p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau fasilitas..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xs border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white outline-none focus:border-[#006370] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
            {[
              { id: "all", label: "Semua Tipe" },
              { id: "meeting_room", label: "Meeting Room" },
              { id: "private_office", label: "Private Office" },
              { id: "desk", label: "Desk" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer ${
                  typeFilter === t.id
                    ? "bg-[#006370] text-white shadow-2xs font-bold"
                    : "text-slate-600 hover:bg-slate-100 font-medium"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 border border-slate-200 p-0.5 rounded-xs self-end sm:self-auto bg-slate-50">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-white text-[#006370] shadow-2xs font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="Tampilan Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-[#006370] shadow-2xs font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="Tampilan Tabel"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#006370] mb-2" />
          <p className="text-xs">Memuat katalog ruangan Anda...</p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xs p-12 text-center shadow-2xs">
          <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-slate-900 mb-1">
            Tidak Ada Ruangan Ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {searchQuery
              ? "Tidak ada ruangan yang cocok dengan kata kunci pencarian Anda."
              : "Anda belum menambahkan ruangan kerja pada venue ini."}
          </p>
          <Link
            href="/dashboard/owner/spaces/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xs bg-[#006370] text-white text-xs font-semibold hover:bg-[#004f59] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Ruangan Sekarang
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSpaces.map((sp) => (
            <div
              key={sp.id}
              className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/10 bg-slate-900 overflow-hidden">
                  <img
                    src={sp.foto || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"}
                    alt={sp.namaSpace}
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-xs bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase font-mono">
                    {getTypeLabel(sp.tipe)}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-900 leading-snug">
                      {sp.namaSpace}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {sp.deskripsi || "Ruangan siap pakai dengan fasilitas lengkap."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="w-4 h-4 text-[#006370]" />
                      {sp.kapasitas} Kursi
                    </span>
                    <div className="text-right">
                      <span className="text-base font-bold text-[#006370] font-mono">
                        {formatRupiah(sp.hargaPerJam)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/ jam</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4 pt-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(sp)}
                  className="flex-1 py-2 rounded-xs border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  Ubah Tarif &amp; Kursi
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(sp)}
                  className="p-2 rounded-xs border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Hapus Ruangan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-mono font-bold uppercase text-slate-400 bg-slate-50/80">
                <th className="py-3 px-4">RUANGAN</th>
                <th className="py-3 px-4">TIPE</th>
                <th className="py-3 px-4">KAPASITAS</th>
                <th className="py-3 px-4">HARGA / JAM</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSpaces.map((sp) => (
                <tr key={sp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xs overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img
                          src={sp.foto || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=120&q=80"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div>{sp.namaSpace}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs font-normal">
                          {sp.deskripsi || "Tanpa deskripsi"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {getTypeLabel(sp.tipe)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium">
                    {sp.kapasitas} Orang
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#006370]">
                    {formatRupiah(sp.hargaPerJam)}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sp)}
                      className="p-1.5 rounded-xs border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(sp)}
                      className="p-1.5 rounded-xs border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingSpace && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Ubah Ruangan
              </h3>
              <button
                type="button"
                onClick={() => setEditingSpace(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Ruangan
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xs bg-slate-50 hover:bg-white focus:bg-white outline-none focus:border-[#006370] text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga / Jam (Rp)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    min={0}
                    step={1000}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xs bg-slate-50 hover:bg-white focus:bg-white outline-none focus:border-[#006370] font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kapasitas (Orang)
                  </label>
                  <input
                    type="number"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xs bg-slate-50 hover:bg-white focus:bg-white outline-none focus:border-[#006370] text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSpace(null)}
                  className="flex-1 py-2 rounded-xs border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2 rounded-xs bg-[#006370] hover:bg-[#004f59] text-white font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs border border-slate-200 p-6 max-w-sm w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-xs bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Hapus Ruangan?
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus <strong>"{deleteTarget.namaSpace}"</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2 rounded-xs border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2 rounded-xs bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus Ruangan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
