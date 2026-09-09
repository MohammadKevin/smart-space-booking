"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getAllBookings,
  updateReservationStatus,
  processCheckIn,
  Reservation,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/components/SpaceCard";
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  Eye,
  QrCode,
  Users,
  Download,
  Building,
} from "lucide-react";

export default function StaffReservationHistoryPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "aktif" | "selesai" | "dibatalkan">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Reservation | null>(null);

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

  const handleManualCheckIn = async (qrCode: string, id: number) => {
    setActionLoadingId(id);
    setActionSuccess(null);
    try {
      await processCheckIn({
        qrCode,
        action: "checkin",
      });
      setActionSuccess(`Check-in reservasi #${id} (${qrCode}) berhasil divalidasi.`);
      await fetchReservations();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return reservations.filter((item) => {
      if (activeTab !== "all" && item.status !== activeTab) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const memberName = (item.member?.namaMember || "").toLowerCase();
        const roomName = (item.detailReservasi?.space?.namaSpace || "").toLowerCase();
        const resId = item.id.toString();
        const qrCode = (item.qrCode || "").toLowerCase();
        return (
          memberName.includes(q) ||
          roomName.includes(q) ||
          resId.includes(q) ||
          qrCode.includes(q)
        );
      }
      return true;
    });
  }, [reservations, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: reservations.length,
      pending: reservations.filter((i) => i.status === "pending").length,
      aktif: reservations.filter((i) => i.status === "aktif").length,
      selesai: reservations.filter((i) => i.status === "selesai").length,
      dibatalkan: reservations.filter((i) => i.status === "dibatalkan").length,
    };
  }, [reservations]);

  const handleExportCsv = () => {
    const headers = "ID,Tanggal,Member,Telepon,Ruangan,Mulai,Durasi Jam,Status,Status Pembayaran,QR Code\n";
    const rows = filteredItems
      .map((r) => {
        const date = r.tanggalReservasi ? r.tanggalReservasi.split("T")[0] : "-";
        const member = r.member?.namaMember || "Member";
        const telp = r.member?.telp || "-";
        const space = r.detailReservasi?.space?.namaSpace || "Ruangan";
        const payment = r.transaksi?.statusPembayaran || "belum_bayar";
        return `"${r.id}","${date}","${member}","${telp}","${space}","${r.jamMulai}",${r.durasiJam},"${r.status}","${payment}","${r.qrCode}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worknest-staff-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>TERMINAL FRONTDESK</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Buku Log &amp; Riwayat Tamu
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Log Reservasi &amp; Tamu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Arsip lengkap seluruh pemesanan ruang kerja, data tamu yang hadir, dan rekonsiliasi status check-in.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xs bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-60 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#006370]" : ""}`} />
            <span>Perbarui</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredItems.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xs bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xs bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs shadow-2xs">
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
        <div className="p-4 rounded-xs bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-bold text-rose-700 hover:text-rose-900 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL RESERVASI
            </span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {counts.all}
          </div>
          <p className="text-[11px] text-slate-500">
            Sesi tercatat pada venue
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              SESI AKTIF
            </span>
            <Users className="w-4 h-4 text-[#006370]" />
          </div>
          <div className="text-2xl font-bold text-[#006370] font-mono">
            {counts.aktif}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            Tamu sedang berada di ruangan
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              MENUNGGU VERIFIKASI
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {counts.pending}
          </div>
          <p className="text-[11px] text-slate-500">
            Belum divalidasi staf
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              SESI SELESAI
            </span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {counts.selesai}
          </div>
          <p className="text-[11px] text-slate-500">
            Reservasi selesai
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
            {[
              { id: "all", label: "Semua", count: counts.all },
              { id: "pending", label: "Pending", count: counts.pending },
              { id: "aktif", label: "Aktif", count: counts.aktif },
              { id: "selesai", label: "Selesai", count: counts.selesai },
              { id: "dibatalkan", label: "Dibatalkan", count: counts.dibatalkan },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-[#006370] text-white shadow-2xs font-bold"
                      : "text-slate-600 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-xs font-mono ${
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID, nama tamu, ruangan..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xs border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white outline-none focus:border-[#006370] transition-colors text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-mono font-bold uppercase text-slate-400 bg-slate-50/80">
                <th className="py-3 px-3">KODE TIKET</th>
                <th className="py-3 px-3">TAMU / MEMBER</th>
                <th className="py-3 px-3">RUANGAN</th>
                <th className="py-3 px-3">JADWAL</th>
                <th className="py-3 px-3">STATUS SESI</th>
                <th className="py-3 px-3 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#006370]" />
                    <span>Memuat log reservasi...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">Belum ada data reservasi</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Reservasi tamu akan muncul di tabel log ini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((r) => {
                  const space = r.detailReservasi?.space;
                  const memberName = r.member?.namaMember || `Member #${r.memberId}`;
                  const roomName = space?.namaSpace || `Ruang #${r.id}`;
                  const date = r.tanggalReservasi ? r.tanggalReservasi.split("T")[0] : "-";
                  const isPending = r.status === "pending";
                  const isAktif = r.status === "aktif";
                  const isSelesai = r.status === "selesai";
                  const isDibatalkan = r.status === "dibatalkan";

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-slate-900">
                          #{r.id}
                        </div>
                        <span className="text-[10px] font-mono text-[#006370] font-bold">
                          {r.qrCode || "QR-PENDING"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-slate-900">{memberName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.member?.telp || "-"}</p>
                      </td>

                      <td className="py-3.5 px-3 font-medium text-slate-700">
                        {roomName}
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        <p className="font-semibold text-slate-900">{date}</p>
                        <p className="text-[10px] text-slate-400">{r.jamMulai} WIB ({r.durasiJam} Jam)</p>
                      </td>

                      <td className="py-3.5 px-3">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                        {isAktif && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        )}
                        {isSelesai && (
                          <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Selesai
                          </span>
                        )}
                        {isDibatalkan && (
                          <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Dibatalkan
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(r)}
                          className="p-1.5 rounded-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                          title="Lihat Rincian"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleManualCheckIn(r.qrCode, r.id)}
                            disabled={actionLoadingId === r.id}
                            className="px-2.5 py-1 rounded-xs bg-[#006370] hover:bg-[#004f59] text-white font-semibold text-[10px] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {actionLoadingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Validasi Check-In"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Rincian Reservasi #{selectedDetail.id}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Dibuat pada {selectedDetail.createdAt ? selectedDetail.createdAt.split("T")[0] : "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="p-1 rounded-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="bg-slate-50 p-3.5 rounded-xs space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Tamu:</span>
                  <strong className="text-slate-900">{selectedDetail.member?.namaMember || "Member"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nomor Telepon:</span>
                  <span className="text-slate-700 font-mono">{selectedDetail.member?.telp || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ruangan:</span>
                  <strong className="text-slate-900">{selectedDetail.detailReservasi?.space?.namaSpace || "Ruangan"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jadwal:</span>
                  <span className="text-slate-700">
                    {selectedDetail.tanggalReservasi?.split("T")[0]} &bull; {selectedDetail.jamMulai} WIB ({selectedDetail.durasiJam} Jam)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Biaya:</span>
                  <strong className="text-[#006370] font-mono">
                    {formatRupiah(selectedDetail.detailReservasi?.totalHarga || 0)}
                  </strong>
                </div>
              </div>

              {selectedDetail.qrCode && (
                <div className="text-center p-4 bg-slate-50 rounded-xs border border-slate-200/80">
                  <div className="w-24 h-24 mx-auto bg-slate-900 p-2 rounded-xs flex items-center justify-center mb-2">
                    <QrCode className="w-14 h-14 text-white" />
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-700 block">
                    {selectedDetail.qrCode}
                  </span>
                  <span className="text-[10px] text-slate-400">Kode Akses Check-In Tamu</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="w-full py-2 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer"
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
