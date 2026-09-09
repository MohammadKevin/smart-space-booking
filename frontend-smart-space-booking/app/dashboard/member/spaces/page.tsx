"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getSpaces, Space, getApiErrorMessage } from "@/lib/api";
import { SpaceCard } from "@/components/SpaceCard";
import {
  Search,
  Building2,
  Compass,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

export default function MemberSpacesPage() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("tipe") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialCapacity = searchParams.get("kapasitas") || "";

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState(initialType);
  const [minCapacity, setMinCapacity] = useState(initialCapacity);

  const fetchSpacesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSpaces();
      setSpaces(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpacesData();
  }, []);

  const filteredSpaces = useMemo(() => {
    return spaces.filter((space) => {
      if (selectedType && space.tipe !== selectedType) {
        return false;
      }
      if (minCapacity && (space.kapasitas || 0) < parseInt(minCapacity, 10)) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = space.namaSpace?.toLowerCase().includes(query);
        const matchDesc = space.deskripsi?.toLowerCase().includes(query);
        const matchCoworking = space.owner?.namaCoworking?.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCoworking) {
          return false;
        }
      }
      return true;
    });
  }, [spaces, selectedType, minCapacity, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType("");
    setMinCapacity("");
  };

  const hasActiveFilters = Boolean(searchQuery || selectedType || minCapacity);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>PORTAL MEMBER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Katalog &amp; Ketersediaan Ruangan
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Cari &amp; Reservasi Ruang Kerja
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Eksplorasi ruang kerja berstandar profesional sesuai kebutuhan kapasitas dan durasi jam pemakaian.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchSpacesData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#006370]" : "text-slate-500"}`} />
            <span>Perbarui</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xs border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama ruangan, coworking space, atau fasilitas..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:col-span-6 gap-2 sm:gap-3">
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-xs font-medium text-slate-900 focus:outline-none cursor-pointer transition-colors truncate"
              >
                <option value="">Semua Tipe</option>
                <option value="desk">Hot Desk / Workstation</option>
                <option value="meeting_room">Meeting Room</option>
                <option value="private_office">Private Office</option>
              </select>
            </div>

            <div>
              <select
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-xs font-medium text-slate-900 focus:outline-none cursor-pointer transition-colors truncate"
              >
                <option value="">Semua Kapasitas</option>
                <option value="1">Min. 1 Orang</option>
                <option value="4">Min. 4 Orang</option>
                <option value="8">Min. 8 Orang</option>
                <option value="12">Min. 12+ Orang</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1 hidden sm:inline">Kategori:</span>
            {[
              { id: "", label: "Semua" },
              { id: "desk", label: "Hot Desk" },
              { id: "meeting_room", label: "Meeting Room" },
              { id: "private_office", label: "Private Office" },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setSelectedType(pill.id)}
                className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition-colors cursor-pointer ${
                  selectedType === pill.id
                    ? "bg-[#006370] text-white shadow-2xs font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-slate-500 text-xs">
            <span>
              Menampilkan <strong>{filteredSpaces.length}</strong> dari <strong>{spaces.length}</strong> ruangan
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xs bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Gagal Memuat Inventaris Ruangan</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-[#006370] mb-2" />
          <p className="text-xs">Memuat katalog ruangan...</p>
        </div>
      ) : filteredSpaces.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      ) : (
        <div className="p-10 sm:p-14 text-center bg-white rounded-xs border border-slate-200 shadow-2xs space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xs bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-base font-bold text-slate-900">
              {spaces.length === 0 ? "Belum Ada Ruangan Terdaftar" : "Tidak Ada Ruangan yang Sesuai"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {spaces.length === 0
                ? "Saat ini belum ada data ruangan yang aktif di sistem."
                : "Coba sesuaikan kata kunci pencarian atau ubah kriteria filter kapasitas/tipe."}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xs transition-colors cursor-pointer"
              >
                Hapus Semua Filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
