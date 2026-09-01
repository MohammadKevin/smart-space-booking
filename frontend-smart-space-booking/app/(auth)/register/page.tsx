"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  registerMember,
  registerOwner,
  RegisterMemberDto,
  RegisterOwnerDto,
  getApiErrorMessage,
} from "@/lib/api";
import {
  Building2,
  Lock,
  User,
  Phone,
  MapPin,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Building,
} from "lucide-react";

type RegisterRole = "member" | "owner";

function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<RegisterRole>("member");

  // Common Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Member Specific
  const [namaMember, setNamaMember] = useState("");
  const [memberTelp, setMemberTelp] = useState("");
  const [instansi, setInstansi] = useState("");
  const [memberAlamat, setMemberAlamat] = useState("");

  // Owner Specific
  const [namaCoworking, setNamaCoworking] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");
  const [ownerTelp, setOwnerTelp] = useState("");
  const [alamat, setAlamat] = useState("");

  // State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim()) {
      setErrorMessage("Username tidak boleh kosong");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      if (role === "member") {
        if (!namaMember.trim()) {
          setErrorMessage("Nama lengkap member wajib diisi");
          setLoading(false);
          return;
        }
        if (!memberTelp.trim()) {
          setErrorMessage("Nomor telepon member wajib diisi");
          setLoading(false);
          return;
        }

        const dto: RegisterMemberDto = {
          username: username.trim(),
          password,
          namaMember: namaMember.trim(),
          instansi: instansi.trim() || "Umum / Personal",
          alamat: memberAlamat.trim() || "Indonesia",
          telp: memberTelp.trim(),
        };

        const res = await registerMember(dto);
        setSuccessMessage(
          res.message || "Pendaftaran akun Member berhasil! Mengarahkan ke halaman login..."
        );
      } else {
        if (!namaCoworking.trim()) {
          setErrorMessage("Nama coworking space / brand wajib diisi");
          setLoading(false);
          return;
        }
        if (!namaPemilik.trim()) {
          setErrorMessage("Nama pemilik / penanggung jawab wajib diisi");
          setLoading(false);
          return;
        }
        if (!ownerTelp.trim()) {
          setErrorMessage("Nomor telepon coworking wajib diisi");
          setLoading(false);
          return;
        }
        if (!alamat.trim()) {
          setErrorMessage("Alamat lengkap coworking wajib diisi");
          setLoading(false);
          return;
        }

        const dto: RegisterOwnerDto = {
          username: username.trim(),
          password,
          namaCoworking: namaCoworking.trim(),
          namaPemilik: namaPemilik.trim(),
          telp: ownerTelp.trim(),
          alamat: alamat.trim(),
        };

        const res = await registerOwner(dto);
        setSuccessMessage(
          res.message || "Pendaftaran akun Space Owner berhasil! Mengarahkan ke halaman login..."
        );
      }

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-slate-50">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Operational Info & Staff Provisioning Notice */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-white">SmartSpace</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Pendaftaran Akun Baru
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pilih peran Anda untuk mulai memesan workstation atau mendaftarkan inventaris coworking space Anda.
              </p>
            </div>

            {/* Role Explanations */}
            <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
                <p className="font-semibold text-white">1. Akun Member</p>
                <p className="text-[11px] text-slate-400">
                  Untuk individu, pekerja remote, atau tim yang ingin menyewa ruang kerja dengan tiket QR mandiri.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
                <p className="font-semibold text-white">2. Akun Space Owner</p>
                <p className="text-[11px] text-slate-400">
                  Untuk pemilik atau pengelola coworking space yang mengelola inventaris ruangan dan analitik finansial.
                </p>
              </div>
            </div>

            {/* Staff Policy Box */}
            <div className="p-3 rounded-lg bg-sky-950/60 border border-sky-800/50 text-[11px] text-sky-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-white">Ketentuan Akun Staff:</p>
                <p className="text-sky-300 text-[10px] leading-relaxed">
                  Akun Staff tidak dapat didaftarkan secara mandiri. Staff ditambahkan secara internal melalui Dashboard Space Owner.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 relative z-10 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Direct Live API</span>
            <span className="text-slate-300 font-mono">UKK 2026</span>
          </div>
        </div>

        {/* Right Side: Clean 2-Option Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Plain Pill Toggle - Strict 2 Options */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => {
                  setRole("member");
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                  role === "member"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Akun Member
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole("owner");
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                  role === "owner"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Akun Space Owner
              </button>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMessage && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Common Fields: Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      placeholder="Username unik"
                      className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
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
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
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
              </div>

              {/* Conditional Fields based on Role */}
              {role === "member" ? (
                <div className="space-y-3.5 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nama Lengkap Member
                    </label>
                    <input
                      type="text"
                      required
                      value={namaMember}
                      onChange={(e) => setNamaMember(e.target.value)}
                      placeholder="Nama lengkap sesuai identitas"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Nomor Telepon / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={memberTelp}
                          onChange={(e) => setMemberTelp(e.target.value)}
                          placeholder="081234567890"
                          className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Instansi / Perusahaan
                      </label>
                      <input
                        type="text"
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                        placeholder="Personal / Nama Perusahaan"
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Alamat Domisili
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={memberAlamat}
                        onChange={(e) => setMemberAlamat(e.target.value)}
                        placeholder="Kota atau alamat domisili"
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nama Coworking Space / Brand
                    </label>
                    <input
                      type="text"
                      required
                      value={namaCoworking}
                      onChange={(e) => setNamaCoworking(e.target.value)}
                      placeholder="Contoh: Kuncie Hub Malang"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Nama Pemilik / PIC
                      </label>
                      <input
                        type="text"
                        required
                        value={namaPemilik}
                        onChange={(e) => setNamaPemilik(e.target.value)}
                        placeholder="Nama penanggung jawab"
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        No. Telepon Coworking
                      </label>
                      <input
                        type="tel"
                        required
                        value={ownerTelp}
                        onChange={(e) => setOwnerTelp(e.target.value)}
                        placeholder="081234567890"
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Alamat Lengkap Coworking
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        placeholder="Alamat jalan, gedung, atau nomor lokasi"
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar sebagai {role === "member" ? "Member" : "Space Owner"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Sudah memiliki akun terdaftar?{" "}
              <Link
                href="/login"
                className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-slate-50">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
