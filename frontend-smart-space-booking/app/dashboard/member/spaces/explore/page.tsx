"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSpaces, Space, getApiErrorMessage } from "@/lib/api";
import { SpaceCard } from "@/components/SpaceCard";
import {
  Search,
  Compass,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  Building2,
} from "lucide-react";

function MemberSpacesExploreContent() {
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <Compass className="w-3.5 h-3.5 text-cyan-600" />
            <span>Eksplorasi Ruang Kerja</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Katalog Inventaris Ruangan
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Cari dan reservasi workstation fisik, meeting room, atau private office sesuai kebutuhan kapasitas dan waktu kerja Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSpacesData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama ruangan, coworking space, atau fasilitas..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
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
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-600 rounded-lg text-xs font-medium text-slate-900 focus:outline-none cursor-pointer transition-colors truncate"
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
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-600 rounded-lg text-xs font-medium text-slate-900 focus:outline-none cursor-pointer transition-colors truncate"
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

        {/* Quick Filter Pills */}
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
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  selectedType === pill.id
                    ? "bg-cyan-600 text-white shadow-xs"
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

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Gagal Memuat Inventaris Ruangan</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2.5 py-3.5 px-5 bg-gradient-to-r from-cyan-50/80 via-white to-sky-50/80 rounded-xl border border-cyan-200/80 text-cyan-800 text-xs font-bold shadow-2xs">
            <Loader2 className="w-4 h-4 text-cyan-600 animate-spin shrink-0" />
            <span>Memuat Katalog & Ketersediaan Ruangan...</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse shadow-xs"
              >
                <div className="aspect-[16/10] bg-slate-200/70" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredSpaces.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-10 sm:p-14 text-center bg-white rounded-xl border border-slate-200 space-y-4 max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {spaces.length === 0 ? "Belum Ada Ruangan Terdaftar" : "Tidak Ada Ruangan yang Sesuai"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {spaces.length === 0
                ? "Saat ini belum ada data ruangan yang aktif di sistem."
                : "Coba sesuaikan kata kunci pencarian atau ubah kriteria filter kapasitas/tipe."}
            </p>
          </div>

          {hasActiveFilters && (
            <div className="pt-2 flex items-center justify-center">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Hapus Semua Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MemberSpacesExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mx-auto" />
        </div>
      }
    >
      <MemberSpacesExploreContent />
    </Suspense>
  );
}

