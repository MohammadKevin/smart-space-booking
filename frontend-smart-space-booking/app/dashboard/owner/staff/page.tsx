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
  ShieldCheck,
  Search,
  MessageCircle,
} from "lucide-react";

export default function OwnerStaffPage() {
  const { user } = useAuth();

  const [staffs, setStaffs] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

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
      setStaffs(data);
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

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError("Password minimal 6 karakter");
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
      setActionSuccess(`Akun Staff "${namaStaff}" berhasil didaftarkan ke sistem.`);
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
      const staffDisplayName =
        deleteTarget.namaStaff ||
        deleteTarget.staff?.namaStaff ||
        deleteTarget.user?.email ||
        deleteTarget.email ||
        "Staff";
      await deleteStaff(deleteTarget.id);
      setActionSuccess(`Akun staff "${staffDisplayName}" berhasil dihapus.`);
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
    return staffs.filter((st) => {
      const name = st.namaStaff || st.staff?.namaStaff || "";
      const emailVal = st.user?.email || st.email || "";
      const phone = st.telp || st.staff?.telp || "";
      const q = searchQuery.toLowerCase();
      return name.toLowerCase().includes(q) || emailVal.toLowerCase().includes(q) || phone.includes(q);
    });
  }, [staffs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Akun Staff
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Daftarkan petugas resepsionis untuk mengoperasikan terminal scanner QR dan check-in tiket pengunjung.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchStaffs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Staff Baru</span>
          </button>
        </div>
      </div>

      {/* Information Banner (Clean & Neutral) */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3 text-xs text-slate-700 shadow-2xs">
        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900">Kebijakan Registrasi Internal & Hak Akses</p>
          <p className="text-slate-500 leading-relaxed">
            Akun Staff didaftarkan secara internal oleh Space Owner. Setelah didaftarkan, petugas dapat login ke portal untuk memvalidasi tiket masuk dan check-in member di resepsionis.
          </p>
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

      {/* Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama staff, email, atau nomor telepon..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total: <span className="font-mono text-slate-900 font-bold">{filteredStaffs.length}</span> Petugas
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat daftar staff...</p>
          </div>
        ) : filteredStaffs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nama Petugas</th>
                  <th className="py-3 px-4">Email Akun</th>
                  <th className="py-3 px-4">Kontak WhatsApp</th>
                  <th className="py-3 px-4">Hak Akses Sistem</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaffs.map((st) => {
                  const staffName =
                    st.namaStaff ||
                    st.staff?.namaStaff ||
                    st.user?.email ||
                    st.email ||
                    "Staff Operasional";
                  const staffEmail = st.user?.email || st.email || "-";
                  const staffTelp = st.telp || st.staff?.telp || "-";
                  const initialChar = staffName.charAt(0).toUpperCase() || "S";

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {initialChar}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{staffName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">#{st.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {staffEmail}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {staffTelp !== "-" ? (
                          <a
                            href={`https://wa.me/${staffTelp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>{staffTelp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-800 border border-slate-200 inline-flex items-center gap-1">
                          <span>Terminal QR Check-In</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(st)}
                          className="px-2.5 py-1 hover:bg-rose-50 text-rose-600 rounded-lg border border-rose-200 transition-all inline-flex items-center gap-1 font-semibold cursor-pointer"
                          title="Hapus Staff"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center max-w-md mx-auto space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Belum Ada Akun Staff</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchQuery ? "Tidak ditemukan staff dengan kata kunci tersebut." : "Tambahkan akun staff untuk membantu proses validasi dan check-in tiket di meja resepsionis."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
            >
              Tambah Staff Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Registrasi Akun Staff Baru
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Akses operasional scanner check-in resepsionis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Nama Lengkap Staff
                </label>
                <input
                  type="text"
                  required
                  value={namaStaff}
                  onChange={(e) => setNamaStaff(e.target.value)}
                  placeholder="Contoh: Muhammad Kevin"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Akun
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: staff@example.com"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  No. Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={telp}
                    onChange={(e) => setTelp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Daftarkan Staff</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Akun Staff?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <strong>{deleteTarget.namaStaff || deleteTarget.staff?.namaStaff || deleteTarget.user?.email || deleteTarget.email || "Staff Ini"}</strong>?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Ya, Hapus</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
