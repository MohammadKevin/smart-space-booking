"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getSuperAdminOwners,
  SuperAdminSpaceOwner,
  getApiErrorMessage,
} from "@/lib/api";
import { formatRupiah } from "@/components/SpaceCard";
import {
  Building2,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Users,
  Phone,
  Mail,
  Download,
  Building,
  MapPin,
  Calendar,
  X,
  CreditCard,
  Receipt,
  Layers,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

export default function SuperAdminOwnersPage() {
  const [owners, setOwners] = useState<SuperAdminSpaceOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedOwner, setSelectedOwner] = useState<SuperAdminSpaceOwner | null>(null);

  const fetchOwners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSuperAdminOwners();
      setOwners(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    owners.forEach((o) => {
      const addr = o.alamat || "";
      if (addr) {
        const parts = addr.split(",");
        const city = parts[parts.length - 1]?.trim();
        if (city) set.add(city);
      }
    });
    return Array.from(set);
  }, [owners]);

  const filteredOwners = useMemo(() => {
    return owners.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.namaCoworking.toLowerCase().includes(q) ||
        o.namaPemilik.toLowerCase().includes(q) ||
        (o.user?.email || "").toLowerCase().includes(q) ||
        (o.alamat || "").toLowerCase().includes(q) ||
        (o.telp || "").includes(q);

      const matchCity =
        selectedCity === "all" ||
        (o.alamat || "").toLowerCase().includes(selectedCity.toLowerCase());

      return matchSearch && matchCity;
    });
  }, [owners, searchQuery, selectedCity]);

  const totalGmv = useMemo(
    () => owners.reduce((acc, o) => acc + (o.gmv || 0), 0),
    [owners]
  );
  const totalPayout = useMemo(
    () => owners.reduce((acc, o) => acc + (o.netPayout || 0), 0),
    [owners]
  );
  const totalSpacesCount = useMemo(
    () => owners.reduce((acc, o) => acc + (o.totalSpaces || 0), 0),
    [owners]
  );

  const handleExportCsv = () => {
    const headers = "ID,Coworking,Pemilik,Alamat,Telepon,Email,Total Ruangan,Total Staff,Total Reservasi,Reservasi Lunas,GMV,Fee Platform,Net Payout\n";
    const rows = filteredOwners
      .map((o) => {
        return `"${o.id}","${o.namaCoworking}","${o.namaPemilik}","${o.alamat || ""}","${o.telp || ""}","${o.user?.email || ""}","${o.totalSpaces || 0}","${o.totalStaffs || 0}","${o.totalBookings || 0}","${o.paidBookings || 0}",${o.gmv || 0},${o.platformFee || 0},${o.netPayout || 0}`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worknest-mitra-space-owner-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Mitra Space Owner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Daftar seluruh pemilik coworking space resmi yang bermitra dengan platform WorkNest, termasuk performa reservasi dan bagi hasil payout.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchOwners}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#006370]" : ""}`} />
            <span>Perbarui</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredOwners.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              TOTAL MITRA OWNER
            </span>
            <Building className="w-4 h-4 text-[#006370]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {owners.length}
          </div>
          <p className="text-[11px] text-slate-500">
            Penyedia coworking terdaftar
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              TOTAL RUANGAN
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalSpacesCount}
          </div>
          <p className="text-[11px] text-slate-500">
            Unit desk, meeting room &amp; office
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              TOTAL GMV MITRA
            </span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-[#006370] font-mono">
            {formatRupiah(totalGmv)}
          </div>
          <p className="text-[11px] text-slate-500">
            Gross booking value mitra
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              TOTAL NET PAYOUT
            </span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatRupiah(totalPayout)}
          </div>
          <p className="text-[11px] text-slate-500">
            Setelah potongan fee platform
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama coworking, pemilik, email, telepon..."
            className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {availableCities.length > 0 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xs text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Kota ({owners.length})</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <span className="text-xs text-slate-400 font-medium">
            Menampilkan {filteredOwners.length} dari {owners.length} mitra
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">COWORKING &amp; ALAMAT</th>
                <th className="py-3.5 px-4 font-bold">PEMILIK &amp; KONTAK</th>
                <th className="py-3.5 px-4 font-bold">RUANGAN / STAF</th>
                <th className="py-3.5 px-4 font-bold">RESERVASI</th>
                <th className="py-3.5 px-4 font-bold">TOTAL GMV</th>
                <th className="py-3.5 px-4 font-bold">NET PAYOUT</th>
                <th className="py-3.5 px-4 font-bold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#006370] mx-auto mb-2" />
                    <span>Memuat direktori mitra...</span>
                  </td>
                </tr>
              ) : filteredOwners.length > 0 ? (
                filteredOwners.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedOwner(o)}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E6F4F2] text-[#006370] flex items-center justify-center shrink-0 border border-[#BCE3DE]">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{o.namaCoworking}</p>
                          <p className="text-[11px] text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[220px]">
                              {o.alamat || "Alamat belum diatur"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{o.namaPemilik}</p>
                      <div className="space-y-0.5 mt-0.5 text-[11px] text-slate-500">
                        {o.user?.email && (
                          <p className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{o.user.email}</span>
                          </p>
                        )}
                        {o.telp && (
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{o.telp}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      <div>
                        <span className="font-bold text-slate-900">{o.totalSpaces || 0}</span>
                        <span className="text-slate-500 text-[11px]"> Ruangan</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {o.totalStaffs || 0} Staff
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {o.totalBookings || 0} Total
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold">
                        {o.paidBookings || 0} Lunas
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatRupiah(o.gmv || 0)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {formatRupiah(o.netPayout || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOwner(o);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {searchQuery
                      ? "Tidak ada mitra space owner yang sesuai dengan kata kunci pencarian."
                      : "Belum ada mitra space owner terdaftar di platform."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOwner && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E6F4F2] text-[#006370] flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    {selectedOwner.namaCoworking}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID Mitra: #OWN-{String(selectedOwner.id).padStart(3, "0")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOwner(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  INFORMASI PEMILIK &amp; KONTAK
                </p>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Pemilik</span>
                    <strong className="text-slate-900">{selectedOwner.namaPemilik}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Terdaftar</span>
                    <span className="font-mono text-slate-900">{selectedOwner.user?.email || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">No. Telepon</span>
                    <span className="text-slate-900">{selectedOwner.telp || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tanggal Bergabung</span>
                    <span className="text-slate-900">
                      {selectedOwner.createdAt ? new Date(selectedOwner.createdAt).toLocaleDateString("id-ID") : "-"}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Alamat Venue</span>
                    <span className="text-slate-900">{selectedOwner.alamat || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#E6F4F2]/50 border border-[#BCE3DE] space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#006370]">
                    TOTAL GMV TRANSAKSI
                  </span>
                  <p className="text-lg font-bold font-mono text-slate-900">
                    {formatRupiah(selectedOwner.gmv || 0)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Komisi Platform: {formatRupiah(selectedOwner.platformFee || 0)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
                    NET PAYOUT MITRA
                  </span>
                  <p className="text-lg font-bold font-mono text-emerald-800">
                    {formatRupiah(selectedOwner.netPayout || 0)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Siap dicairkan / settled
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-slate-400 text-[11px] block">Inventaris Ruangan</span>
                  <span className="text-base font-bold text-slate-900">{selectedOwner.totalSpaces || 0} Unit Ruangan</span>
                  <span className="text-[10px] text-slate-500 block">{selectedOwner.totalStaffs || 0} Staff Terdaftar</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-slate-400 text-[11px] block">Performa Reservasi</span>
                  <span className="text-base font-bold text-slate-900">{selectedOwner.totalBookings || 0} Total Pesanan</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">{selectedOwner.paidBookings || 0} Berhasil Lunas</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOwner(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
