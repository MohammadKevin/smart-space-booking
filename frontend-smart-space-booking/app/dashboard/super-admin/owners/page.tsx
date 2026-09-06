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
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react";

export default function SuperAdminOwnersPage() {
  const [owners, setOwners] = useState<SuperAdminSpaceOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredOwners = useMemo(() => {
    return owners.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchCoworking = o.namaCoworking.toLowerCase().includes(q);
      const matchOwner = o.namaPemilik.toLowerCase().includes(q);
      const matchEmail = (o.user?.email || "").toLowerCase().includes(q);
      const matchPhone = (o.telp || "").includes(q);
      return matchCoworking || matchOwner || matchEmail || matchPhone;
    });
  }, [owners, searchQuery]);

  const totalGmvAll = useMemo(() => {
    return owners.reduce((acc, o) => acc + (o.gmv || 0), 0);
  }, [owners]);

  const totalPlatformFeesAll = useMemo(() => {
    return owners.reduce((acc, o) => acc + (o.platformFee || 0), 0);
  }, [owners]);

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Mitra Space Owner (Merchants / Sellers)
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Kelola data pengelola coworking space, perputaran omzet toko (GMV), dan bagi hasil platform.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Komisi Platform</p>
            <p className="text-sm font-extrabold text-emerald-700 font-mono">{formatRupiah(totalPlatformFeesAll)}</p>
          </div>
          <button
            type="button"
            onClick={fetchOwners}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama coworking, pemilik, email, atau telepon..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total: <span className="font-mono text-slate-900 font-bold">{filteredOwners.length}</span> Mitra Coworking
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat data mitra space owner...</p>
          </div>
        ) : filteredOwners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nama Coworking</th>
                  <th className="py-3 px-4">Pemilik & Kontak</th>
                  <th className="py-3 px-4">Inventaris</th>
                  <th className="py-3 px-4">Omzet Toko (GMV)</th>
                  <th className="py-3 px-4">Komisi Platform</th>
                  <th className="py-3 px-4">Hak Bersih Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOwners.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {o.namaCoworking.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{o.namaCoworking}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{o.alamat}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-semibold text-slate-900">{o.namaPemilik}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        {o.user?.email && <span className="font-mono">{o.user.email}</span>}
                        {o.telp && (
                          <a
                            href={`https://wa.me/${o.telp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>{o.telp}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-medium text-slate-800">{o.totalSpaces} Ruangan</p>
                      <p className="text-[10px] text-slate-400">{o.totalStaffs} Staff Resepsionis</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatRupiah(o.gmv)}
                      <span className="block text-[10px] text-slate-400 font-normal font-sans">
                        {o.paidBookings} / {o.totalBookings} booking lunas
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {formatRupiah(o.platformFee)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatRupiah(o.netPayout)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center max-w-md mx-auto space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Mitra Space Owner</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? "Tidak ditemukan mitra dengan kata kunci pencarian tersebut."
                : "Belum ada mitra space owner yang terdaftar di platform."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
