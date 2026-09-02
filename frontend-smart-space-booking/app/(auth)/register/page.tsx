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
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Compass,
  Check,
  Building,
} from "lucide-react";

type RegisterRole = "member" | "owner";

function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<RegisterRole>("member");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [namaMember, setNamaMember] = useState("");
  const [memberTelp, setMemberTelp] = useState("");
  const [instansi, setInstansi] = useState("");
  const [memberAlamat, setMemberAlamat] = useState("");

  const [namaCoworking, setNamaCoworking] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");
  const [ownerTelp, setOwnerTelp] = useState("");
  const [alamat, setAlamat] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Email tidak boleh kosong");
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
          email: email.trim(),
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
          email: email.trim(),
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
    <div className="min-h-screen flex items-center justify-center py-[50px] sm:py-[75px] px-4 sm:px-8 lg:px-12 bg-slate-100/80 relative overflow-hidden">
      <Link
        href="/"
        className="absolute top-5 left-5 sm:top-7 sm:left-8 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/95 hover:bg-white text-slate-700 hover:text-cyan-700 font-semibold text-xs border border-slate-200 shadow-xs hover:shadow-md hover:border-cyan-300 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-600 transition-transform group-hover:-translate-x-0.5" />
        <span>Kembali ke Beranda</span>
      </Link>

      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-6 right-8 opacity-20 pointer-events-none hidden sm:block">
        <div className="flex gap-2 transform -rotate-45">
          <div className="w-1.5 h-16 bg-cyan-600 rounded-full" />
          <div className="w-1.5 h-16 bg-cyan-600 rounded-full" />
          <div className="w-1.5 h-16 bg-cyan-600 rounded-full" />
          <div className="w-1.5 h-16 bg-cyan-600 rounded-full" />
        </div>
      </div>

      <div className="w-full max-w-5xl lg:max-w-6xl bg-white rounded-xl shadow-2xl shadow-slate-400/25 border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 lg:h-[640px]">
        <div className="lg:col-span-6 bg-gradient-to-br from-cyan-50/90 via-sky-50/50 to-blue-50/30 p-8 sm:p-10 lg:p-12 flex flex-col justify-between items-center text-center relative border-b lg:border-b-0 lg:border-r border-cyan-100/90 h-full">
          <div className="space-y-2 max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
              Solusi lengkap untuk{" "}
              <span className="text-cyan-600 font-extrabold">Member</span> dan{" "}
              <span className="text-sky-600 font-extrabold">Pengelola Coworking</span> secara instan!
            </h2>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-68 h-68 sm:w-76 sm:h-76 rounded-xl overflow-hidden shadow-xl shadow-cyan-900/10 border-2 border-white bg-white">
              <img
                src="/auth-register-illustration.jpg"
                alt="SmartSpace Onboarding Illustration"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute -top-3 -left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-cyan-200 shadow-md flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Building className="w-4 h-4 text-cyan-600" />
              <span>WorkNest</span>
            </div>

            <div className="absolute -bottom-3 -right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-cyan-200 shadow-md flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Registrasi Cepat</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>Mulai Reservasi & Kelola Ruangan Kerja</span>
          </div>
        </div>

        <div className="lg:col-span-6 p-8 sm:p-10 lg:p-12 flex flex-col justify-between h-full overflow-y-auto">
          <div className="space-y-3.5 max-w-md mx-auto w-full my-auto">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs flex items-center justify-center bg-white">
                  <img src="/icon-web.png" alt="WorkNest" className="w-full h-full object-cover" />
                </div>
                <span className="font-extrabold text-slate-900 text-xl tracking-tight">
                  WorkNest
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-0.5">
                Buat Akun Baru
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Sudah memiliki akun?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
                >
                  Masuk Sekarang
                </Link>
              </p>
            </div>

            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => {
                  setRole("member");
                  setErrorMessage(null);
                }}
                className={`py-1.5 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === "member"
                    ? "bg-white text-cyan-900 shadow-xs border border-cyan-200"
                    : "text-slate-600 hover:text-slate-900"
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
                className={`py-1.5 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === "owner"
                    ? "bg-white text-cyan-900 shadow-xs border border-cyan-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${role === "owner" ? "text-cyan-600" : "text-slate-400"}`} />
                <span>2. Akun Space Owner</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
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
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer rounded"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {role === "member" ? (
                <div className="space-y-2.5 pt-0.5">
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
                      className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Nomor Telepon
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={memberTelp}
                          onChange={(e) => setMemberTelp(e.target.value)}
                          placeholder="081234567890"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
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
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-0.5">
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
                      className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
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
                        placeholder="Alamat jalan, gedung, atau lokasi"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                <span>Akun Staff ditambahkan via Dashboard Space Owner (tidak lewat registrasi mandiri).</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-600/30 cursor-pointer"
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

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Dengan mendaftar, kamu menyetujui{" "}
              <span className="text-cyan-600 font-medium">Syarat & Ketentuan</span> WorkNest.
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
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-slate-100">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}



