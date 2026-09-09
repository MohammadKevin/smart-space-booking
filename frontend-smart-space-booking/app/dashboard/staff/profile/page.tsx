"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile, UpdateProfileDto, getApiErrorMessage } from "@/lib/api";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Building,
  Server,
  Activity,
} from "lucide-react";

export default function StaffProfilePage() {
  const { user, refreshUser } = useAuth();

  const [namaStaff, setNamaStaff] = useState("");
  const [email, setEmail] = useState("");
  const [telp, setTelp] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      if (user.staff) {
        setNamaStaff(user.staff.namaStaff || "");
        setTelp(user.staff.telp || "");
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (newPassword || confirmPassword || oldPassword) {
      if (!oldPassword) {
        setErrorMessage("Masukkan kata sandi lama untuk mengubah kata sandi.");
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage("Kata sandi baru minimal 6 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("Konfirmasi kata sandi baru tidak cocok.");
        return;
      }
    }

    setLoading(true);

    try {
      const dto: UpdateProfileDto = {
        nama: namaStaff.trim(),
        email: email.trim(),
        telp: telp.trim(),
        oldPassword: oldPassword || undefined,
        password: newPassword || undefined,
      };

      await updateProfile(dto);
      if (refreshUser) {
        await refreshUser();
      }

      setSuccessMessage("Profil akun staf berhasil diperbarui.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>TERMINAL FRONTDESK</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Profil Staf &amp; Kredensial Login
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Pengaturan Akun Staf
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Perbarui data identitas staf, nomor kontak operasional, serta kata sandi login terminal.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xs text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-base font-bold text-slate-900">
                    Informasi Profil Staf
                  </h2>
                  <p className="text-xs text-slate-500">
                    Data identitas resmi petugas operasional frontdesk.
                  </p>
                </div>
                <User className="w-4 h-4 text-slate-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Nama Lengkap Staf
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={namaStaff}
                      onChange={(e) => setNamaStaff(e.target.value)}
                      placeholder="Nama lengkap staf"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-slate-900 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Nomor WhatsApp / Telepon
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={telp}
                      onChange={(e) => setTelp(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-slate-900 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700">
                    Email Login Akun
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@worknest.id"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-slate-900 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-base font-bold text-slate-900">
                    Keamanan &amp; Kata Sandi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Perbarui kata sandi login akun frontdesk.
                  </p>
                </div>
                <KeyRound className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5 max-w-md">
                  <label className="block font-bold text-slate-700">
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama"
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-slate-900 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-slate-900 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs text-slate-900 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-bold rounded-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan Akun</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xs p-5 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-11 h-11 rounded-xs bg-[#E6F4F2] border border-[#BCE3DE] text-[#006370] flex items-center justify-center font-bold text-base font-mono shrink-0">
                {(namaStaff || "ST").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate">
                  {namaStaff || "Staf Frontdesk"}
                </h3>
                <p className="text-xs text-slate-500 font-mono truncate">
                  {email || user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Peran Akun</span>
                <span className="px-2 py-0.5 bg-[#E6F4F2] text-[#006370] border border-[#BCE3DE] rounded-xs font-bold text-[10px] font-mono uppercase">
                  Staff Frontdesk
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Otoritas Terminal</span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Validasi &amp; Gate Scanner</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ID Staf</span>
                <span className="font-mono font-bold text-slate-800">
                  #STF-{String(user?.staff?.id || user?.id || 1).padStart(3, "0")}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Nomor Telepon</span>
                <span className="font-mono font-medium text-slate-800">{telp || "-"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xs p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-serif">
              <ShieldCheck className="w-4 h-4 text-[#006370]" />
              <span>Protokol Keamanan Terminal</span>
            </div>
            <div className="space-y-2 text-[11px] text-slate-500">
              <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-xs border border-slate-100">
                <Server className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>Koneksi aman terenkripsi HTTPS dengan backend WorkNest.</span>
              </div>
              <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-xs border border-slate-100">
                <Activity className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>Setiap aksi check-in tercatat pada audit log sistem secara otomatis.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
