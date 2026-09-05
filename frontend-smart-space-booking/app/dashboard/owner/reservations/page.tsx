"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getAllBookings,
  updateReservationStatus,
  Reservation,
  ReservationStatus,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah } from "@/components/SpaceCard";
import {
  CalendarClock,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  Eye,
  Check,
  QrCode,
  Tag,
  MessageCircle,
} from "lucide-react";

export default function OwnerReservationsPage() {
  const { user } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBookings();
      setReservations(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleStatusChange = async (id: number, newStatus: ReservationStatus) => {
    setActionLoadingId(id);
    setActionSuccess(null);
    try {
      await updateReservationStatus(id, newStatus);
      const label =
        newStatus === "disetujui"
          ? "disetujui"
          : newStatus === "aktif"
          ? "diaktifkan (check-in)"
          : newStatus === "selesai"
          ? "diselesaikan"
          : "dibatalkan";

      setActionSuccess(`Reservasi #${id} berhasil ${label}.`);
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      await fetchReservations();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    return reservations.filter((r) => {
      const matchTab = activeTab === "all" || r.status === activeTab;
      const memberName = r.member?.namaMember || "";
      const spaceName = r.detailReservasi?.space?.namaSpace || "";
      const date = r.tanggalReservasi || "";
      const q = searchQuery.toLowerCase();

      const matchQuery =
        !q ||
        memberName.toLowerCase().includes(q) ||
        spaceName.toLowerCase().includes(q) ||
        date.includes(q) ||
        String(r.id).includes(q);

      return matchTab && matchQuery;
    });
  }, [reservations, activeTab, searchQuery]);

  const counts = useMemo(() => {
    const res = {
      all: reservations.length,
      pending: 0,
      disetujui: 0,
      aktif: 0,
      selesai: 0,
      dibatalkan: 0,
    };
    for (const r of reservations) {
      if (res[r.status] !== undefined) {
        res[r.status] += 1;
      }
    }
    return res;
  }, [reservations]);

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Persetujuan & Riwayat Reservasi
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Verifikasi pemesanan masuk, approval reservasi, dan pantau status jadwal sewa member.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
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

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100/80 rounded-lg w-full lg:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-white text-amber-900 shadow-2xs font-bold border border-amber-200"
                : "text-amber-700 hover:text-amber-900"
            }`}
          >
            <span>Pending</span>
            {counts.pending > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {counts.pending}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("disetujui")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "disetujui"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Disetujui ({counts.disetujui})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("aktif")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "aktif"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Aktif ({counts.aktif})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("selesai")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "selesai"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Selesai ({counts.selesai})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dibatalkan")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "dibatalkan"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Dibatalkan ({counts.dibatalkan})
          </button>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari member, ruangan, ID..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat data pemesanan...</p>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Ruangan</th>
                  <th className="py-3 px-4">Jadwal & Durasi</th>
                  <th className="py-3 px-4">Total Biaya</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => {
                  const rawDate = b.tanggalReservasi ? b.tanggalReservasi.split("T")[0] : "-";
                  const spaceName = b.detailReservasi?.space?.namaSpace || `Space #${b.id}`;
                  const memberName = b.member?.namaMember || `Member #${b.memberId}`;
                  const cost = b.detailReservasi?.totalHarga || 0;
                  const isActing = actionLoadingId === b.id;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{memberName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {b.member?.instansi ? `${b.member.instansi} • ` : ""}#{b.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{spaceName}</p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {b.detailReservasi?.space?.tipe || "Workstation"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{rawDate}, {b.jamMulai} WIB</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          Durasi: {b.durasiJam} Jam
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">
                          {formatRupiah(cost)}
                        </p>
                        {b.detailReservasi?.diskon && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                            <Tag className="w-2.5 h-2.5" />
                            <span>Kupon {b.detailReservasi.diskon.persentaseDiskon}%</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Detail
                        </button>

                        {b.status === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleStatusChange(b.id, "disetujui")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors inline-flex items-center gap-1 text-xs font-semibold shadow-2xs cursor-pointer disabled:opacity-60"
                            >
                              {isActing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Setujui
                            </button>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleStatusChange(b.id, "dibatalkan")}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md border border-rose-200 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-60"
                            >
                              <X className="w-3.5 h-3.5 text-rose-500" />
                              Tolak
                            </button>
                          </>
                        )}

                        {b.status === "disetujui" && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleStatusChange(b.id, "aktif")}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors inline-flex items-center gap-1 text-xs font-semibold shadow-2xs cursor-pointer disabled:opacity-60"
                          >
                            {isActing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Check-In
                          </button>
                        )}

                        {b.status === "aktif" && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleStatusChange(b.id, "selesai")}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors inline-flex items-center gap-1 text-xs font-semibold shadow-2xs cursor-pointer disabled:opacity-60"
                          >
                            {isActing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Selesai
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center max-w-md mx-auto space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
              <CalendarClock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Reservasi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery ? "Tidak ditemukan pesanan dengan kata kunci pencarian tersebut." : "Belum ada riwayat reservasi pada kategori filter yang dipilih."}
            </p>
          </div>
        )}
      </div>

      {/* Reservation Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Rincian Reservasi #{selectedBooking.id}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Kode Tiket: {selectedBooking.qrCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Informasi Pemesan
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {selectedBooking.member?.namaMember || "Member"}
                    </p>
                    <p className="text-slate-500">
                      {selectedBooking.member?.instansi || "Instansi Umum"}
                    </p>
                  </div>
                  {selectedBooking.member?.telp && (
                    <a
                      href={`https://wa.me/${selectedBooking.member.telp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ruangan
                  </span>
                  <p className="font-bold text-slate-900">
                    {selectedBooking.detailReservasi?.space?.namaSpace || "Space"}
                  </p>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {selectedBooking.detailReservasi?.space?.tipe || "Workstation"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Jadwal & Waktu
                  </span>
                  <p className="font-bold text-slate-900">
                    {selectedBooking.tanggalReservasi ? selectedBooking.tanggalReservasi.split("T")[0] : "-"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedBooking.jamMulai} WIB ({selectedBooking.durasiJam} Jam)
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Biaya
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 font-mono">
                    {formatRupiah(selectedBooking.detailReservasi?.totalHarga || 0)}
                  </p>
                </div>
                <div>
                  <StatusBadge status={selectedBooking.status} />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                {selectedBooking.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedBooking.id, "dibatalkan")}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg border border-rose-200 cursor-pointer"
                    >
                      Tolak Pemesanan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedBooking.id, "disetujui")}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui Reservasi</span>
                    </button>
                  </>
                )}
                {selectedBooking.status === "disetujui" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedBooking.id, "aktif")}
                    className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Konfirmasi Check-In</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
