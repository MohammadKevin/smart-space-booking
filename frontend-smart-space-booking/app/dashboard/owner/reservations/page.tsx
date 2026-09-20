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

export default function OwnerReservationsPage() {
  const { user } = useAuth();
  const [realReservations, setRealReservations] = useState<Reservation[]>([]);
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
      setRealReservations(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleStatusChange = async (numericId: number, newStatus: ReservationStatus) => {
    setActionLoadingId(numericId);
    setActionSuccess(null);
    try {
      await updateReservationStatus(numericId, newStatus);
      setActionSuccess(`Status reservasi #${numericId} berhasil diperbarui menjadi ${newStatus}.`);
      await fetchReservations();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return realReservations.filter((item) => {
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
  }, [realReservations, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: realReservations.length,
      pending: realReservations.filter((i) => i.status === "pending").length,
      aktif: realReservations.filter((i) => i.status === "aktif").length,
      selesai: realReservations.filter((i) => i.status === "selesai").length,
      dibatalkan: realReservations.filter((i) => i.status === "dibatalkan").length,
    };
  }, [realReservations]);

  const totalRevenue = useMemo(() => {
    return realReservations
      .filter((r) => r.transaksi?.statusPembayaran === "lunas" || r.status === "selesai")
      .reduce((acc, curr) => acc + (curr.detailReservasi?.totalHarga || 0), 0);
  }, [realReservations]);

  const handleExportCsv = () => {
    const headers = "ID,Tanggal,Member,Ruangan,Mulai,Durasi Jam,Total Harga,Status,Status Pembayaran\n";
    const rows = filteredItems
      .map((r) => {
        const date = r.tanggalReservasi ? r.tanggalReservasi.split("T")[0] : "-";
        const member = r.member?.namaMember || "Member";
        const space = r.detailReservasi?.space?.namaSpace || "Ruangan";
        const total = r.detailReservasi?.totalHarga || 0;
        const payment = r.transaksi?.statusPembayaran || "belum_bayar";
        return `"${r.id}","${date}","${member}","${space}","${r.jamMulai}",${r.durasiJam},${total},"${r.status}","${payment}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worknest-reservasi-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-slate-900 pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 mb-1">
            <span>WORKSPACE OWNER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Buku Reservasi &amp; Validasi Sesi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Reservasi Tamu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Pantau reservasi ruangan masuk secara real-time, jadwal sewa, status pembayaran, dan validasi check-in member.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          <button
            type="button"
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-sky-600" : ""}`} />
            <span>Perbarui</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredItems.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-sky-800 text-xs shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="font-bold text-sky-700 hover:text-sky-900 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs shadow-sm">
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
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL RESERVASI
            </span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {counts.all}
            </span>
            <span className="text-xs text-slate-500 font-medium font-sans">Sesi</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Akumulasi seluruh pemesanan
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              RESERVASI AKTIF
            </span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-700 font-mono">
              {counts.aktif}
            </span>
            <span className="text-xs text-slate-500 font-medium font-sans">Sedang Berlangsung</span>
          </div>
          <div className="text-[11px] text-sky-700 font-medium">
            Tamu telah check-in di ruangan
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              MENUNGGU KONFIRMASI
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 font-mono">
              {counts.pending}
            </span>
            <span className="text-xs text-slate-500 font-medium font-sans">Pending</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Perlu verifikasi pembayaran
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              PENDAPATAN TERSELESAIKAN
            </span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatRupiah(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-400">
            {counts.selesai} sesi selesai
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
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
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-sky-600 text-white shadow-sm font-bold"
                      : "text-slate-600 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
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
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-colors text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-mono font-bold uppercase text-slate-400 bg-slate-50/80">
                <th className="py-3 px-3">KODE RESERVASI</th>
                <th className="py-3 px-3">TAMU / MEMBER</th>
                <th className="py-3 px-3">RUANGAN</th>
                <th className="py-3 px-3">JADWAL SEWA</th>
                <th className="py-3 px-3">TOTAL BIAYA</th>
                <th className="py-3 px-3">STATUS RESERVASI</th>
                <th className="py-3 px-3 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    <span>Memuat data reservasi...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">Belum ada data reservasi</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Reservasi yang dilakukan oleh member akan muncul di tabel ini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((r) => {
                  const space = r.detailReservasi?.space;
                  const memberName = r.member?.namaMember || `Member #${r.memberId}`;
                  const roomName = space?.namaSpace || `Ruang #${r.id}`;
                  const date = r.tanggalReservasi ? r.tanggalReservasi.split("T")[0] : "-";
                  const total = r.detailReservasi?.totalHarga || 0;
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
                        <span className="text-[10px] font-mono text-slate-400">
                          {r.qrCode || "QR-PENDING"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900">{memberName}</div>
                        <div className="text-[10px] text-slate-400">
                          {r.member?.instansi || r.member?.telp || "-"}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900">{roomName}</div>
                        <div className="text-[10px] text-slate-400">
                          {space?.kapasitas ? `${space.kapasitas} Kursi` : "-"}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">{date}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {r.jamMulai} WIB &bull; {r.durasiJam} Jam
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-slate-900">
                          {formatRupiah(total)}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                            r.transaksi?.statusPembayaran === "lunas"
                              ? "bg-sky-50 text-sky-700 border border-sky-100"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {r.transaksi?.statusPembayaran === "lunas" ? "Lunas" : "Belum Lunas"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                        {isAktif && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100 flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                            Aktif
                          </span>
                        )}
                        {isSelesai && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Selesai
                          </span>
                        )}
                        {isDibatalkan && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Dibatalkan
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(r)}
                          className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-sm"
                          title="Lihat Rincian"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r.id, "aktif")}
                              disabled={actionLoadingId === r.id}
                              className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-[10px] transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-sky-600/20"
                            >
                              Konfirmasi
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r.id, "dibatalkan")}
                              disabled={actionLoadingId === r.id}
                              className="px-2.5 py-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[10px] transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </>
                        )}

                        {isAktif && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.id, "selesai")}
                            disabled={actionLoadingId === r.id}
                            className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-[10px] transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-sky-600/20"
                          >
                            Selesaikan
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-sm space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Rincian Reservasi #{selectedDetail.id}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Dibuat pada {selectedDetail.createdAt ? selectedDetail.createdAt.split("T")[0] : "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Tamu:</span>
                  <strong className="text-slate-900">{selectedDetail.member?.namaMember || "Member"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Instansi / Kontak:</span>
                  <span className="text-slate-700">{selectedDetail.member?.instansi || selectedDetail.member?.telp || "-"}</span>
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
                  <strong className="text-sky-700 font-mono font-bold">
                    {formatRupiah(selectedDetail.detailReservasi?.totalHarga || 0)}
                  </strong>
                </div>
              </div>

              {selectedDetail.qrCode && (
                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-24 h-24 mx-auto bg-slate-900 p-2 rounded-xl flex items-center justify-center mb-2">
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
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-sky-600/25 transition-colors cursor-pointer"
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
