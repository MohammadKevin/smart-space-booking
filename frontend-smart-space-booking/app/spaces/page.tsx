"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSpaces, Space, getApiErrorMessage } from "@/lib/api";
import { SpaceCard } from "@/components/SpaceCard";
import {
  Search,
  MapPin,
  Compass,
  RefreshCw,
  Loader2,
  X,
  SlidersHorizontal,
  Building2,
  Zap,
  ShieldCheck,
  LayoutGrid,
  List,
  ArrowRight,
  ChevronRight,
  Filter,
} from "lucide-react";

function SpacesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("tipe") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialCapacity = searchParams.get("kapasitas") || "";

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedMetro, setSelectedMetro] = useState("");
  const [minCapacity, setMinCapacity] = useState(initialCapacity);
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"rating" | "price_asc" | "price_desc">("rating");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchSpacesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSpaces();
      setSpaces(data || []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpacesData();
  }, []);

  // Extract real cities / metros from space locations
  const availableMetros = useMemo(() => {
    const metros = new Set<string>();
    spaces.forEach((space) => {
      const addr = space.owner?.alamat || space.owner?.namaCoworking;
      if (addr) {
        const parts = addr.split(",");
        const lastPart = parts[parts.length - 1]?.trim() || addr.trim();
        if (lastPart) metros.add(lastPart);
      }
    });
    return Array.from(metros);
  }, [spaces]);

  const filteredSpaces = useMemo(() => {
    let result = spaces.filter((space) => {
      // Type filter
      if (selectedType && space.tipe !== selectedType) {
        return false;
      }
      // Capacity filter
      if (minCapacity && (space.kapasitas || 0) < parseInt(minCapacity, 10)) {
        return false;
      }
      // Max price filter
      if (maxPrice && space.hargaPerJam > parseInt(maxPrice, 10)) {
        return false;
      }
      // Metro filter
      if (selectedMetro) {
        const addr = (space.owner?.alamat || space.owner?.namaCoworking || "").toLowerCase();
        if (!addr.includes(selectedMetro.toLowerCase())) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = space.namaSpace?.toLowerCase().includes(query);
        const matchDesc = space.deskripsi?.toLowerCase().includes(query);
        const matchCoworking = space.owner?.namaCoworking?.toLowerCase().includes(query);
        const matchAddr = space.owner?.alamat?.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCoworking && !matchAddr) {
          return false;
        }
      }
      return true;
    });

    // Sort
    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => a.hargaPerJam - b.hargaPerJam);
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => b.hargaPerJam - a.hargaPerJam);
    }

    return result;
  }, [spaces, selectedType, selectedMetro, minCapacity, maxPrice, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType("");
    setSelectedMetro("");
    setMinCapacity("");
    setMaxPrice("");
    setSelectedAmenity(null);
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedType || selectedMetro || minCapacity || maxPrice || selectedAmenity
  );

  const totalPages = Math.ceil(filteredSpaces.length / itemsPerPage) || 1;
  const paginatedSpaces = filteredSpaces.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-[#fcfdfd] min-h-screen text-slate-900 pb-20">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="border-b border-slate-200/80 bg-white py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-900">Ketersediaan Real-Time</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              {spaces.length > 0 ? `${spaces.length} Hub Terverifikasi di Seluruh Indonesia` : "48 Hub Terverifikasi di Seluruh Indonesia"}
            </span>
          </div>

          <div className="flex items-center gap-5 text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-600" />
              <span>Konfirmasi Instan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Standar Ergonomis</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 2. FILTERS CONTAINER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
          {/* Main search and dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama hub, distrik, atau lokasi (cth. SCBD, Senopati, Klojen)..."
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#0D5C63] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Metro Selector */}
            <div className="md:col-span-2">
              <select
                value={selectedMetro}
                onChange={(e) => setSelectedMetro(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#0D5C63] rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="">Kota: Semua Lokasi</option>
                {availableMetros.length > 0 ? (
                  availableMetros.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Jakarta">Jakarta</option>
                    <option value="Surabaya">Surabaya</option>
                    <option value="Malang">Malang</option>
                    <option value="Bandung">Bandung</option>
                    <option value="Bali">Bali</option>
                  </>
                )}
              </select>
            </div>

            {/* Type Selector */}
            <div className="md:col-span-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#0D5C63] rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="">Tipe: Semua Ruangan</option>
                <option value="desk">Flex Desk / Workstation</option>
                <option value="meeting_room">Ruang Rapat</option>
                <option value="private_office">Suite Privat</option>
              </select>
            </div>

            {/* Capacity Selector */}
            <div className="md:col-span-2">
              <select
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#0D5C63] rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="">Kapasitas: Semua</option>
                <option value="1">1 Orang</option>
                <option value="4">4+ Orang</option>
                <option value="8">8+ Orang</option>
                <option value="12">12+ Orang</option>
              </select>
            </div>

            {/* Max Price */}
            <div className="md:col-span-2">
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#0D5C63] rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="">Tarif: Semua</option>
                <option value="50000">Rp 50.000 / jam</option>
                <option value="100000">Rp 100.000 / jam</option>
                <option value="250000">Rp 250.000 / jam</option>
                <option value="500000">Rp 500.000 / jam</option>
              </select>
            </div>
          </div>

          {/* Amenities Bar & Sort */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                FASILITAS:
              </span>
              {[
                "Wi-Fi 500+ Mbps",
                "Monitor 4K",
                "Whiteboard",
                "Kopi Artisan",
                "Phone Booth",
                "Akses 24/7",
              ].map((amenity) => {
                const isSelected = selectedAmenity === amenity;
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => setSelectedAmenity(isSelected ? null : amenity)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
                      isSelected
                        ? "bg-[#0D5C63] text-white border-[#0D5C63]"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-cyan-600"
                      }`}
                    />
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="rating">Rating Tertinggi</option>
                  <option value="price_asc">Harga Terendah</option>
                  <option value="price_desc">Harga Tertinggi</option>
                </select>
              </div>

              <button
                type="button"
                onClick={fetchSpacesData}
                disabled={loading}
                aria-label="Segarkan Ruangan"
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. SECTION HEADING */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Ruang Kerja &amp; Meja Eksekutif
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
              Koleksi ruang kedap suara berstandar enterprise, meja fleksibel, dan ruang presentasi pilihan.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-cyan-700 hover:text-cyan-900 font-semibold underline underline-offset-4 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
            <span className="text-slate-400 font-medium">
              {filteredSpaces.length} dari {spaces.length} Ruangan
            </span>
          </div>
        </div>

        {/* 4. REAL DATA SPACES GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse space-y-3"
              >
                <div className="aspect-[16/10] bg-slate-200/70" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-4 bg-slate-100 rounded w-16" />
                    <div className="h-4 bg-slate-100 rounded w-16" />
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                    <div className="h-8 bg-slate-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-rose-200 space-y-3">
            <Building2 className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Gagal Memuat Katalog Ruangan</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={fetchSpacesData}
              className="mt-2 px-4 py-2 bg-[#0D5C63] hover:bg-[#094348] text-white text-xs font-semibold rounded-lg"
            >
              Coba Lagi
            </button>
          </div>
        ) : paginatedSpaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {paginatedSpaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="p-14 text-center bg-white rounded-2xl border border-slate-200 space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Tidak Ada Ruangan yang Sesuai Filter
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {spaces.length === 0
                  ? "Belum ada inventaris ruangan aktif di database saat ini."
                  : "Coba sesuaikan kata kunci pencarian, pilihan kota, atau kapasitas ruangan."}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#0D5C63] hover:bg-[#094348] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        )}

        {/* 5. DISTRICT GEO-FENCING BANNER */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-700 tracking-wider uppercase">
              <Building2 className="w-3.5 h-3.5" />
              <span>GEO-FENCING DISTRIK</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 leading-tight">
              Butuh ruangan di dekat stasiun MRT atau KRL tertentu?
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Jelajahi peta interaktif kami untuk melihat kepadatan meja dan ruangan dalam radius jalan kaki 5 menit di Jakarta, Malang, Surabaya, dan Bandung.
            </p>
          </div>

          <Link
            href="/#protocol"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors shrink-0 shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-slate-600" />
            <span>Buka Peta Geo</span>
          </Link>
        </div>

        {/* 6. PAGINATION */}
        {filteredSpaces.length > itemsPerPage && (
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              Menampilkan{" "}
              <strong className="font-semibold text-slate-900">
                {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredSpaces.length)}
              </strong>{" "}
              dari{" "}
              <strong className="font-semibold text-slate-900">
                {filteredSpaces.length}
              </strong>{" "}
              ruang kerja terverifikasi
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === page
                      ? "bg-[#0D5C63] text-white"
                      : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SpacesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-6 h-6 text-[#0D5C63] animate-spin" />
        </div>
      }
    >
      <SpacesContent />
    </Suspense>
  );
}
