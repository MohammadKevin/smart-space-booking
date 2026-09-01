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
  Compass,
  Check,
  Sparkles,
  QrCode,
  TrendingUp,
  CreditCard,
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
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-white grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
      {/* Left Side: Architectural Showcase Panel with Live Role Benefits */}
      <div className="lg:col-span-5 bg-gradient-to-br from-cyan-50/90 via-sky-50/50 to-blue-50/30 border-b lg:border-b-0 lg:border-r border-cyan-100 p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle Geometric Background Pattern */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#0891b2 0.75px, transparent 0.75px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="space-y-8 relative z-10">
          {/* Logo & Signal Badge */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-cyan-200 shadow-xs flex items-center justify-center bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-web.png" alt="SmartSpace" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-base tracking-tight block leading-tight">
                  SmartSpace
                </span>
                <span className="text-[10px] text-cyan-700 font-semibold uppercase tracking-wider block leading-none">
                  Registrasi Terpadu
                </span>
              </div>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/90 backdrop-blur-xs border border-cyan-200/80 text-cyan-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              Daftar Instan
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Mulai Reservasi Cerdas & Kontrol Ruang Kerja
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Pilih peran akun Anda untuk memesan workstation fleksibel atau kelola inventaris coworking space Anda.
            </p>
          </div>

          {/* Dynamic Interactive Role Mockup Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-white/95 backdrop-blur-md border border-cyan-200/90 shadow-md shadow-cyan-950/5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                  {role === "member" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Status Akun Terpilih
                  </p>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {role === "member" ? "Member Pass (Individu & Tim)" : "Space Host Partner (Owner)"}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                <Check className="w-2.5 h-2.5" />
                Aktif
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {role === "member" ? (
                <>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Tiket QR digital terbit instan setelah booking</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Akses fleksibel: Hot Desk, Meeting Room, Private Office</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Riwayat reservasi dan status check-in real-time</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Kelola inventaris ruangan & atur tarif sewa per jam</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Tambahkan akun tim staff untuk scanner resepsionis</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Grafik analitik pendapatan & utilisasi ruang kerja</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Staff Policy Callout Box */}
          <div className="p-3.5 rounded-xl bg-white/90 border border-cyan-200/80 text-xs text-slate-700 flex items-start gap-2.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900 text-[11px]">Informasi Akun Staff:</p>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                Akun Staff tidak didaftarkan secara mandiri. Staff ditambahkan secara internal melalui Dashboard Space Owner.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="pt-8 border-t border-cyan-200/60 text-[11px] text-slate-500 flex items-center justify-between relative z-10">
          <span>Koneksi Live REST API</span>
          <span className="font-mono text-slate-400">UKK RPL 2026</span>
        </div>
      </div>

      {/* Right Side: Ultra Clean Pure White Register Form */}
      <div className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-14 flex flex-col justify-center max-w-xl mx-auto w-full space-y-5 overflow-y-auto">
        <div className="space-y-5">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 mb-1">
              <Sparkles className="w-3 h-3 text-cyan-600" />
              <span>Pendaftaran Akun Baru</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Buat Akun Anda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lengkapi data di bawah ini untuk memulai registrasi ke dalam sistem.
            </p>
          </div>

          {/* Segmented Tab Role Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => {
                setRole("member");
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === "member"
                  ? "bg-white text-cyan-900 shadow-sm border border-cyan-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <User className={`w-3.5 h-3.5 ${role === "member" ? "text-cyan-600" : "text-slate-400"}`} />
              <span>1. Akun Member</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("owner");
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === "owner"
                  ? "bg-white text-cyan-900 shadow-sm border border-cyan-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${role === "owner" ? "text-cyan-600" : "text-slate-400"}`} />
              <span>2. Akun Space Owner</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs shadow-2xs">
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
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username unik"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Fields based on Role */}
            {role === "member" ? (
              <div className="space-y-3 pt-1">
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
                    className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nomor Telepon / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={memberTelp}
                        onChange={(e) => setMemberTelp(e.target.value)}
                        placeholder="081234567890"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
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
                      placeholder="Personal / Nama Kantor"
                      className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Alamat Domisili
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={memberAlamat}
                      onChange={(e) => setMemberAlamat(e.target.value)}
                      placeholder="Kota atau alamat domisili"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
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
                    placeholder="Contoh: Kuncie Space Malang"
                    className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
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
                      className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
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
                      className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Alamat Lengkap Coworking
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      placeholder="Alamat jalan, gedung, atau lokasi"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/25 cursor-pointer"
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

        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Sudah memiliki akun terdaftar?{" "}
            <Link
              href="/login"
              className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>

          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Utama</span>
            </Link>
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
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-white">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}


