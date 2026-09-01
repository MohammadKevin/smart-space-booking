"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerMember, registerOwner, getApiErrorMessage } from "@/lib/api";
import {
  Building2,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Building,
  Phone,
  MapPin,
  Briefcase,
  Users,
  ShieldCheck,
  Mail,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  // Strict 2-Option Toggle Only (Member vs Space Owner)
  const [roleTab, setRoleTab] = useState<"member" | "owner">("member");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Common Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Member Specific States
  const [namaMember, setNamaMember] = useState("");
  const [instansi, setInstansi] = useState("");
  const [alamatMember, setAlamatMember] = useState("");
  const [telpMember, setTelpMember] = useState("");

  // Owner Specific States
  const [namaCoworking, setNamaCoworking] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");
  const [alamatOwner, setAlamatOwner] = useState("");
  const [telpOwner, setTelpOwner] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      if (roleTab === "member") {
        await registerMember({
          username: username.trim(),
          password,
          namaMember: namaMember.trim(),
          instansi: instansi.trim(),
          alamat: alamatMember.trim(),
          telp: telpMember.trim(),
        });

        setSuccessMessage("Registrasi Member berhasil! Mengalihkan ke verifikasi...");
        // Transition to verification flow post-registration
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(username.trim())}&role=member`);
        }, 800);
      } else {
        await registerOwner({
          username: username.trim(),
          password,
          namaCoworking: namaCoworking.trim(),
          namaPemilik: namaPemilik.trim(),
          alamat: alamatOwner.trim(),
          telp: telpOwner.trim(),
        });

        setSuccessMessage("Registrasi Space Owner berhasil! Mengalihkan ke verifikasi...");
        // Transition to verification flow post-registration
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(username.trim())}&role=admin_space`);
        }, 800);
      }
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12 bg-slate-50">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shadow-sm">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pendaftaran Akun Baru
          </h1>
          <p className="text-xs text-slate-500">
            Pilih jenis akun untuk mulai menyewa atau mengelola coworking space.
          </p>
        </div>

        {/* Strict 2-Option Toggle Only (Member vs Space Owner) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 gap-1.5">
          <button
            type="button"
            onClick={() => setRoleTab("member")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all ${
              roleTab === "member"
                ? "bg-white text-sky-700 shadow-md shadow-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 text-sky-600 shrink-0" />
            <span>1. Akun Member</span>
          </button>

          <button
            type="button"
            onClick={() => setRoleTab("owner")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all ${
              roleTab === "owner"
                ? "bg-white text-sky-700 shadow-md shadow-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building className="w-4 h-4 text-sky-600 shrink-0" />
            <span>2. Akun Space Owner</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-700 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            <div className="leading-snug">{successMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Username / Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. johndoe"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Role specific inputs */}
          {roleTab === "member" ? (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nama Lengkap Member
                </label>
                <input
                  type="text"
                  required
                  value={namaMember}
                  onChange={(e) => setNamaMember(e.target.value)}
                  placeholder="e.g. Kevin Sanjaya"
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Instansi / Perusahaan
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={instansi}
                      onChange={(e) => setInstansi(e.target.value)}
                      placeholder="e.g. Universitas Airlangga"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    No. Telepon / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={telpMember}
                      onChange={(e) => setTelpMember(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Alamat Domisili
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={alamatMember}
                    onChange={(e) => setAlamatMember(e.target.value)}
                    placeholder="Jl. Pemuda No. 45, Surabaya"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nama Bisnis / Coworking Space
                </label>
                <input
                  type="text"
                  required
                  value={namaCoworking}
                  onChange={(e) => setNamaCoworking(e.target.value)}
                  placeholder="e.g. SpaceWorks Innovation Center"
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nama Pemilik / Pengelola
                  </label>
                  <input
                    type="text"
                    required
                    value={namaPemilik}
                    onChange={(e) => setNamaPemilik(e.target.value)}
                    placeholder="e.g. Budi Santoso"
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    No. Telepon Coworking
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={telpOwner}
                      onChange={(e) => setTelpOwner(e.target.value)}
                      placeholder="081987654321"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Alamat Lengkap Coworking
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={alamatOwner}
                    onChange={(e) => setAlamatOwner(e.target.value)}
                    placeholder="Jl. Basuki Rahmat No. 12-14, Surabaya"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Pendaftaran...</span>
              </>
            ) : (
              <>
                <span>
                  Daftar Sebagai {roleTab === "member" ? "Member" : "Space Owner"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Note */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
          <span>Verifikasi email OTP akan dikirimkan otomatis setelah pendaftaran.</span>
        </div>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
