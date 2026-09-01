"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSpaces, Space, SpaceType, getApiErrorMessage } from "@/lib/api";
import { SpaceCard } from "@/components/SpaceCard";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Building2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Users,
  Grid,
  MapPin,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

function SpacesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const initialType = (searchParams.get("tipe") as SpaceType) || "";
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("search") || "");
  const [minCap, setMinCap] = useState<string>(searchParams.get("minKapasitas") || "");

  const fetchSpacesList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedType) params.tipe = selectedType as SpaceType;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (minCap && parseInt(minCap, 10) > 0) params.minKapasitas = parseInt(minCap, 10);

      const data = await getSpaces(params);
      setSpaces(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedType, searchQuery, minCap]);

  useEffect(() => {
    fetchSpacesList();
  }, [fetchSpacesList]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
  };

  const handleResetFilters = () => {
    setSelectedType("");
    setSearchQuery("");
    setMinCap("");
  };

  const isOwner =
    user?.role?.toLowerCase() === "admin_space" || user?.role?.toLowerCase() === "owner";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Katalog Ruangan Live Real-Time</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Eksplorasi Ruang Kerja & Meeting
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Temukan workstation yang nyaman, meeting room berteknologi tinggi, hingga private office eksklusif siap pakai.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSpacesList}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-sm transition-all focus:outline-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : "text-slate-500"}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Keyword Search Input */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama ruangan, fasilitas, atau deskripsi..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
            />
          </div>

          {/* Min Capacity Filter */}
          <div className="md:col-span-3 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Users className="w-4 h-4" />
            </div>
            <select
              value={minCap}
              onChange={(e) => setMinCap(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all appearance-none cursor-pointer"
            >
              <option value="">Semua Kapasitas</option>
              <option value="1">Min. 1 Orang (Hot Desk)</option>
              <option value="4">Min. 4 Orang (Small Team)</option>
              <option value="8">Min. 8 Orang (Medium Suite)</option>
              <option value="12">Min. 12 Orang (Large Room)</option>
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="md:col-span-3 flex items-center">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* Space Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2">
            Tipe Ruangan:
          </span>
          {[
            { id: "", label: "Semua Kategori" },
            { id: "desk", label: "Hot Desk / Workstation" },
            { id: "meeting_room", label: "Meeting Room" },
            { id: "private_office", label: "Private Office" },
          ].map((tab) => {
            const isSelected = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTypeChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Gagal Mengambil Data Katalog</h4>
            <p className="text-xs mt-0.5">{error}</p>
            <button
              type="button"
              onClick={fetchSpacesList}
              className="mt-2 text-xs font-bold underline hover:text-rose-900"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Content Grid & Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col"
            >
              <div className="aspect-[16/10] bg-slate-200 w-full" />
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-full mt-2" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="h-5 bg-slate-200 rounded w-24" />
                  <div className="h-8 bg-slate-200 rounded-xl w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : spaces.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan <strong>{spaces.length}</strong> ruangan tersedia
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              Tidak Ada Ruangan Ditemukan
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tidak ada space yang sesuai dengan filter atau kata kunci pencarian Anda saat ini.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors inline-block"
          >
            Bersihkan Filter
          </button>
        </div>
      )}
    </div>
  );
}

export default function SpacesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
          Memuat katalog ruangan...
        </div>
      }
    >
      <SpacesContent />
    </Suspense>
  );
}
