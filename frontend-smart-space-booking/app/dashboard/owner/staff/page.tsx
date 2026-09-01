"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  ShieldCheck,
} from "lucide-react";

export default function OwnerStaffPage() {
  const { user } = useAuth();

  const [staffs, setStaffs] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [namaStaff, setNamaStaff] = useState("");
  const [telp, setTelp] = useState("");

  // Delete State
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
    setUsername("");
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
        username: username.trim(),
        password,
        namaStaff: namaStaff.trim(),
        telp: telp.trim(),
      };

      await createStaff(dto);
      setActionSuccess(`Akun Staff "${namaStaff}" berhasil didaftarkan.`);
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
        deleteTarget.user?.username ||
        deleteTarget.username ||
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Manajemen Tim Operasional</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Provisioning Akun Staff
          </h1>
          <p className="text-xs text-slate-500">
            Daftarkan petugas resepsionis untuk mengoperasikan terminal scanner QR dan memvalidasi tiket pengunjung.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStaffs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Staff Baru</span>
          </button>
        </div>
      </div>

      {/* Policy Box */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
        <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900">Kebijakan Registrasi Internal:</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Akun Staff hanya dapat dibuat secara eksklusif oleh Space Owner. Staff yang didaftarkan dapat login ke sistem untuk memproses check-in dan check-out tiket QR member.
          </p>
        </div>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="font-bold text-emerald-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Memuat daftar staff...</p>
          </div>
        ) : staffs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Staff</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">No. Telepon / WhatsApp</th>
                  <th className="py-3 px-4">Hak Akses</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffs.map((st) => {
                  const staffName =
                    st.namaStaff ||
                    st.staff?.namaStaff ||
                    st.user?.username ||
                    st.username ||
                    "Staff Operasional";
                  const staffUsername = st.user?.username || st.username || "-";
                  const staffTelp = st.telp || st.staff?.telp || "-";
                  const initialChar = staffName.charAt(0).toUpperCase() || "S";

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {initialChar}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{staffName}</p>
                            <p className="text-[10px] text-slate-400">ID #{st.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-sky-700">
                        @{staffUsername}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {staffTelp}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Terminal Check-In
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(st)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded border border-rose-200 transition-colors inline-flex items-center gap-1 font-semibold"
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
          <div className="p-12 text-center max-w-sm mx-auto space-y-3">
            <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Belum Ada Akun Staff</h3>
              <p className="text-xs text-slate-500">
                Tambahkan akun staff untuk membantu proses validasi dan check-in tiket di meja resepsionis.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Tambah Staff Pertama
            </button>
          </div>
        )}
      </div>

      {/* Register Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Registrasi Akun Staff Baru
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
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
                  placeholder="Contoh: Ani Lestari"
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Username Akun
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: staff_ani"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 focus:outline-none"
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
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                    placeholder="081223344556"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Daftarkan Staff</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-xl">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Akun Staff?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus <strong>{deleteTarget.namaStaff || deleteTarget.staff?.namaStaff || deleteTarget.user?.username || deleteTarget.username || "Staff Ini"}</strong>?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
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
