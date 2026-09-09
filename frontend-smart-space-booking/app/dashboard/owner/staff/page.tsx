"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getStaffs,
  createStaff,
  deleteStaff,
  StaffUser,
  CreateStaffDto,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  UserCheck,
  Plus,
  Trash2,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Search,
  Download,
  Clock,
  Radio,
  SlidersHorizontal,
  Key,
  ChevronDown,
  Check,
  History,
  Shield,
  ArrowRight,
} from "lucide-react";

export default function OwnerStaffPage() {
  const { user } = useAuth();

  const [staffs, setStaffs] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [namaStaff, setNamaStaff] = useState("");
  const [telp, setTelp] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStaffs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStaffs();
      setStaffs(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffs();
  }, [fetchStaffs]);

  const handleOpenCreate = () => {
    setEmail("");
    setPassword("");
    setNamaStaff("");
    setTelp("");
    setFormError(null);
    setModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password || !namaStaff.trim() || !telp.trim()) {
      setFormError("Semua field formulir wajib diisi.");
      return;
    }

    setFormLoading(true);
    try {
      const dto: CreateStaffDto = {
        email: email.trim(),
        password,
        namaStaff: namaStaff.trim(),
        telp: telp.trim(),
      };
      await createStaff(dto);
      setActionSuccess(`Staf baru "${namaStaff}" berhasil diundang ke sistem.`);
      setModalOpen(false);
      await fetchStaffs();
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStaff(deleteTarget.id);
      setActionSuccess(`Akses staf "${deleteTarget.namaStaff}" berhasil dicabut.`);
      setDeleteTarget(null);
      await fetchStaffs();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredStaffs = useMemo(() => {
    return staffs.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (s.namaStaff || "").toLowerCase().includes(q) ||
        (s.user?.email || "").toLowerCase().includes(q) ||
        (s.telp || "").includes(q);

      return matchSearch;
    });
  }, [staffs, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>WORKSPACE OWNER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Direktori {staffs.length} Staf Operasional
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Manajemen Staf &amp; Frontdesk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola akun resepsionis, hak akses staf venue, dan verifikasi kehadiran operasional coworking space.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchStaffs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#006370]" : ""}`} />
            <span>Perbarui</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const csv =
                "Name,Role,Email,Phone\n" +
                staffs
                  .map((s) => `"${s.namaStaff}","Staff","${s.user?.email || ""}","${s.telp}"`)
                  .join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `worknest-staff-audit-${Date.now()}.csv`;
              a.click();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-bold rounded-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Undang Staf Baru</span>
          </button>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL STAF TERDAFTAR
            </span>
            <UserCheck className="w-4 h-4 text-[#006370]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {staffs.length}
          </div>
          <p className="text-[11px] text-slate-500">
            Akun petugas frontdesk aktif
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              STATUS TERMINAL
            </span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            Online
          </div>
          <p className="text-[11px] text-slate-500">
            Check-in QR Scanner siap
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              LINGKUP OTORITAS
            </span>
            <Radio className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            Frontdesk POS
          </div>
          <p className="text-[11px] text-slate-500">
            Validasi tiket &amp; QR check-in
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              KEAMANAN AUTENTIKASI
            </span>
            <Shield className="w-4 h-4 text-[#006370]" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            JWT Token
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            Enkripsi bcrypt terverifikasi
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama, email, atau no. telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs outline-none text-slate-900 transition-colors"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan {filteredStaffs.length} dari {staffs.length} staf
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#006370] mx-auto mb-2" />
            <p className="text-xs text-slate-500">Memuat direktori staf...</p>
          </div>
        ) : filteredStaffs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Belum ada akun staf terdaftar</p>
            <p className="text-[11px] text-slate-400">
              Undang resepsionis atau staf operasional pertama Anda dengan tombol di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">IDENTITAS STAF</th>
                  <th className="py-3 px-4">EMAIL LOGIN</th>
                  <th className="py-3 px-4">TELEPON / WA</th>
                  <th className="py-3 px-4">HAK AKSES</th>
                  <th className="py-3 px-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStaffs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center font-bold text-xs shrink-0 border border-[#BCE3DE]">
                          {(s.namaStaff || "ST").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.namaStaff || "Staf"}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: #STF-{String(s.id).padStart(3, "0")}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-900">
                      {s.user?.email || "-"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {s.telp || "-"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-semibold">
                        Frontdesk Scanner
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(s)}
                        className="px-2.5 py-1 rounded-xs border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cabut Akses
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xs max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-bold text-slate-900">Undang Anggota Staf Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Staf *</label>
                <input
                  type="text"
                  placeholder="Contoh: Bayu Pratama"
                  value={namaStaff}
                  onChange={(e) => setNamaStaff(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xs outline-none focus:border-[#006370] text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Staf *</label>
                <input
                  type="email"
                  placeholder="bayu.front@worknest.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xs outline-none focus:border-[#006370] text-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp / Telp *</label>
                <input
                  type="tel"
                  placeholder="08123456789"
                  value={telp}
                  onChange={(e) => setTelp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xs outline-none focus:border-[#006370] text-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Awal *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xs outline-none focus:border-[#006370] text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 font-semibold hover:text-slate-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006370] hover:bg-[#004f59] text-white font-bold rounded-xs shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Kirim Undangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xs max-w-sm w-full p-6 shadow-xl space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xs bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900">Cabut Akses Staf?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin mencabut seluruh kredensial &amp; akses sistem milik{" "}
                <strong>"{deleteTarget.namaStaff}"</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xs shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Cabut Akses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
