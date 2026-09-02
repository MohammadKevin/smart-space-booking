"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile, UpdateProfileDto, getApiErrorMessage } from "@/lib/api";
import { ImageUploader } from "@/components/ImageUploader";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
} from "lucide-react";

interface ProfileSettingsFormProps {
  role: "owner" | "staff" | "member";
}

export function ProfileSettingsForm({ role }: ProfileSettingsFormProps) {
  const { user, refreshUser } = useAuth();

  // Basic Info Fields
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [telp, setTelp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [foto, setFoto] = useState<string | undefined>("");
  const [instansi, setInstansi] = useState("");
  const [namaCoworking, setNamaCoworking] = useState("");

  // Security / Password Fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      if (user.member) {
        setNama(user.member.namaMember || "");
        setTelp(user.member.telp || "");
        setAlamat(user.member.alamat || "");
        setInstansi(user.member.instansi || "");
        setFoto(user.member.foto || "");
      } else if (user.spaceOwner) {
        setNama(user.spaceOwner.namaPemilik || "");
        setNamaCoworking(user.spaceOwner.namaCoworking || "");
        setTelp(user.spaceOwner.telp || "");
        setAlamat(user.spaceOwner.alamat || "");
      } else if (user.staff) {
        setNama(user.staff.namaStaff || "");
        setTelp(user.staff.telp || "");
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validate Passwords if entered
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
        nama: nama.trim(),
        email: email.trim(),
        telp: telp.trim(),
        alamat: alamat.trim(),
        foto: foto || undefined,
        instansi: role === "member" ? instansi.trim() : undefined,
        namaCoworking: role === "owner" ? namaCoworking.trim() : undefined,
        oldPassword: oldPassword || undefined,
        password: newPassword || undefined,
      };

      await updateProfile(dto);
      if (refreshUser) {
        await refreshUser();
      }

      setSuccessMessage("Pengaturan profil dan akun berhasil diperbarui.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    if (role === "owner") return "Space Owner / Pengelola";
    if (role === "staff") return "Petugas Staff Resepsionis";
    return "Member Pengguna";
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pengaturan Akun & Profil
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Perbarui data diri, email login, kata sandi, foto profil, dan informasi kontak akun Anda.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-900 border border-cyan-200">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span>{getRoleLabel()}</span>
          </span>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs shadow-2xs">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Gagal Menyimpan Perubahan</p>
            <p className="text-slate-600">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Informasi Diri & Profil */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Informasi Profil & Kontak</h2>
              <p className="text-xs text-slate-500">Data identitas yang terhubung dengan akun WorkNest Anda.</p>
            </div>
            <User className="w-4 h-4 text-cyan-600" />
          </div>

          {/* Photo Upload (Especially for Member & Branding) */}
          {role === "member" && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Foto Profil / Avatar</label>
              <ImageUploader
                value={foto}
                onChange={(val) => setFoto(val || "")}
                label=""
                helperText="Upload foto profil resmi untuk verifikasi saat check-in tiket (JPG, PNG, WebP)."
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                {role === "owner"
                  ? "Nama Pemilik / Penanggung Jawab"
                  : role === "staff"
                  ? "Nama Lengkap Staff"
                  : "Nama Lengkap Member"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Role Specific: Nama Coworking for Owner */}
            {role === "owner" && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Nama Bisnis Coworking Space
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={namaCoworking}
                    onChange={(e) => setNamaCoworking(e.target.value)}
                    placeholder="Contoh: SpaceWorks Hub Surabaya"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Role Specific: Instansi for Member */}
            {role === "member" && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Instansi / Perusahaan / Kampus
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={instansi}
                    onChange={(e) => setInstansi(e.target.value)}
                    placeholder="Nama instansi atau Umum / Personal"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Nomor Telepon */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Nomor Telepon / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={telp}
                  onChange={(e) => setTelp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Alamat (for Owner & Member) */}
            {role !== "staff" && (
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {role === "owner" ? "Alamat Lengkap Coworking Space" : "Alamat Domisili"}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Alamat jalan, gedung, atau kota domisili"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Kredensial Login & Keamanan Akun */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Email & Kata Sandi</h2>
              <p className="text-xs text-slate-500">Ubah email login atau perbarui kata sandi akun Anda.</p>
            </div>
            <KeyRound className="w-4 h-4 text-cyan-600" />
          </div>

          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Alamat Email Login
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Change Sub-section */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-800">
                Ubah Kata Sandi <span className="text-[11px] font-normal text-slate-400">(Kosongkan jika tidak ingin mengubah)</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Old Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">Kata Sandi Saat Ini</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Kata sandi lama"
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer rounded"
                    >
                      {showOldPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer rounded"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">Konfirmasi Sandi Baru</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi sandi baru"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-cyan-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Akun</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
