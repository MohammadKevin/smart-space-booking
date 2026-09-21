"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  login,
  forgotPassword,
  registerMember,
  registerOwner,
  RegisterMemberDto,
  RegisterOwnerDto,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faArrowRight,
  faArrowLeft,
  faUser,
  faUserTie,
  faBuilding,
  faLocationDot,
  faPhone,
  faCircleCheck,
  faCircleExclamation,
  faSpinner,
  faKey,
  faShieldHalved,
  faChair,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

type AuthMode = "login" | "register";
type RegisterRole = "member" | "owner";

interface AuthSplitScreenProps {
  initialMode: AuthMode;
}

export function AuthSplitScreen({ initialMode }: AuthSplitScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const roleParam = (searchParams.get("role") as RegisterRole) || "member";

  const { loginUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      const url = newMode === "login" ? "/login" : "/register";
      window.history.pushState(null, "", url);
    }
  };

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginRememberMe, setLoginRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);
    setUnverifiedEmail(null);

    if (!loginEmail.trim()) {
      setLoginError("Silakan masukkan email Anda.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Silakan masukkan kata sandi Anda.");
      return;
    }

    setLoginLoading(true);

    try {
      const response = await login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      loginUser(response.access_token, response.user, loginRememberMe);
      setLoginSuccess("Autentikasi berhasil. Mengarahkan ke dashboard...");

      setTimeout(() => {
        const role = response.user.role?.toLowerCase();
        const isSuperAdmin = role === "super_admin";
        const isOwner = role === "admin_space" || role === "owner";
        const isStaff = role === "staff";
        const defaultDashboard = isSuperAdmin
          ? "/dashboard/super-admin"
          : isOwner
          ? "/dashboard/owner"
          : isStaff
          ? "/dashboard/staff"
          : "/dashboard/member";

        if (redirectParam) {
          if (!isOwner && redirectParam.startsWith("/dashboard/owner")) {
            router.push(defaultDashboard);
            return;
          }
          if (!isStaff && redirectParam.startsWith("/dashboard/staff")) {
            router.push(defaultDashboard);
            return;
          }
          if (!isSuperAdmin && redirectParam.startsWith("/dashboard/super-admin")) {
            router.push(defaultDashboard);
            return;
          }
          router.push(redirectParam);
          return;
        }

        router.push(defaultDashboard);
      }, 500);
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      setLoginError(msg);
      if (err.response?.data?.isVerified === false || msg.toLowerCase().includes("verifik")) {
        setUnverifiedEmail(loginEmail.trim());
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Silakan masukkan alamat email Anda.");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      await forgotPassword({ email: forgotEmail.trim() });
      setForgotModalOpen(false);
      router.push(`/verify-email?email=${encodeURIComponent(forgotEmail.trim())}&type=reset`);
    } catch (err: unknown) {
      setForgotError(getApiErrorMessage(err));
    } finally {
      setForgotLoading(false);
    }
  };

  const [registerRole, setRegisterRole] = useState<RegisterRole>(roleParam);
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regAgreed, setRegAgreed] = useState(true);

  const [namaCoworking, setNamaCoworking] = useState("");
  const [alamat, setAlamat] = useState("");

  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regAgreed) {
      setRegError("Silakan setujui Syarat & Ketentuan serta Kebijakan Privasi.");
      return;
    }

    if (!regEmail.trim()) {
      setRegError("Alamat email tidak boleh kosong.");
      return;
    }

    if (regPassword.length < 8) {
      setRegError("Kata sandi minimal 8 karakter.");
      return;
    }

    let cleanPhone = regPhone.trim().replace(/^0/, "");
    if (!cleanPhone.startsWith("+62") && !cleanPhone.startsWith("62")) {
      cleanPhone = "08" + cleanPhone.replace(/^8/, "");
    }

    setRegLoading(true);

    try {
      if (registerRole === "member") {
        if (!regFullName.trim()) {
          setRegError("Silakan masukkan nama lengkap Anda.");
          setRegLoading(false);
          return;
        }

        const dto: RegisterMemberDto = {
          email: regEmail.trim(),
          password: regPassword,
          namaMember: regFullName.trim(),
          instansi: "Member WorkNest",
          alamat: "Indonesia",
          telp: cleanPhone.startsWith("0") ? cleanPhone : "0" + cleanPhone.replace(/^(\+62|62)/, ""),
        };

        const res = await registerMember(dto);
        setRegSuccess(
          res.message || "Akun berhasil dibuat! Mengarahkan ke verifikasi email..."
        );
      } else {
        if (!namaCoworking.trim()) {
          setRegError("Silakan masukkan nama Coworking Space / properti Anda.");
          setRegLoading(false);
          return;
        }
        if (!regFullName.trim()) {
          setRegError("Silakan masukkan nama pengelola atau PIC.");
          setRegLoading(false);
          return;
        }
        if (!alamat.trim()) {
          setRegError("Silakan masukkan alamat properti Anda.");
          setRegLoading(false);
          return;
        }

        const dto: RegisterOwnerDto = {
          email: regEmail.trim(),
          password: regPassword,
          namaCoworking: namaCoworking.trim(),
          namaPemilik: regFullName.trim(),
          telp: cleanPhone.startsWith("0") ? cleanPhone : "0" + cleanPhone.replace(/^(\+62|62)/, ""),
          alamat: alamat.trim(),
        };

        const res = await registerOwner(dto);
        setRegSuccess(
          res.message || "Pendaftaran mitra berhasil! Mengarahkan ke verifikasi email..."
        );
      }

      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(regEmail.trim())}&type=register`);
      }, 800);
    } catch (err: unknown) {
      setRegError(getApiErrorMessage(err));
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-x-hidden bg-white text-slate-900 z-50 selection:bg-sky-500 selection:text-white">
      <div className="hidden lg:flex w-full h-full relative overflow-hidden bg-white">
        <div
          className={`w-1/2 h-full flex flex-col justify-between p-8 xl:p-12 2xl:p-14 overflow-y-auto bg-white transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            mode === "register"
              ? "opacity-100 translate-x-0 pointer-events-auto z-10"
              : "opacity-0 -translate-x-12 pointer-events-none z-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          <div className="max-w-md w-full mx-auto my-auto space-y-4">
            <div className="space-y-1 text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Buat Akun WorkNest
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mulai pesan ruang kerja cerdas atau daftarkan inventaris properti coworking Anda.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setRegisterRole("member");
                  setRegError(null);
                }}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  registerRole === "member"
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
                <span>Member / Booker</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisterRole("owner");
                  setRegError(null);
                }}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  registerRole === "owner"
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FontAwesomeIcon icon={faBuilding} className="w-3 h-3" />
                <span>Space Owner</span>
              </button>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-medium">{regError}</p>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="font-medium">{regSuccess}</p>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {registerRole === "owner" && (
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Coworking / Gedung
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faBuilding}
                      className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      required
                      value={namaCoworking}
                      onChange={(e) => setNamaCoworking(e.target.value)}
                      placeholder="Contoh: Sudirman Creative Hub"
                      className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-slate-700">
                  {registerRole === "owner" ? "Nama Pengelola / PIC" : "Nama Lengkap"}
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={registerRole === "owner" ? faUserTie : faUser}
                    className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder={registerRole === "owner" ? "Nama PIC / Manajer" : "Nama lengkap Anda"}
                    className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {registerRole === "owner" && (
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-semibold text-slate-700">
                    Alamat Properti
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      required
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      placeholder="Jl. Jend. Sudirman Kav. 21, Jakarta"
                      className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-semibold text-slate-700">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nomor WhatsApp
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faPhone}
                      className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi (Min. 8 Karakter)
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                  />
                  <input
                    type={regShowPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                  >
                    <FontAwesomeIcon icon={regShowPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-0.5">
                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={regAgreed}
                    onChange={(e) => setRegAgreed(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer mt-0.5"
                  />
                  <span className="leading-snug text-[11px]">
                    Saya menyetujui <span className="font-semibold text-slate-800">Syarat &amp; Ketentuan</span> serta{" "}
                    <span className="font-semibold text-slate-800">Kebijakan Privasi</span> WorkNest.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {regLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>{registerRole === "owner" ? "Daftar Sebagai Pengelola" : "Daftar Akun Member"}</span>
                    <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-1 text-center text-xs text-slate-500">
              <span>Sudah memiliki akun? </span>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
              >
                Masuk di sini
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} WorkNest Technologies Inc.
          </div>
        </div>

        <div
          className={`w-1/2 h-full flex flex-col justify-between p-8 xl:p-12 2xl:p-14 overflow-y-auto bg-white transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            mode === "login"
              ? "opacity-100 translate-x-0 pointer-events-auto z-10"
              : "opacity-0 translate-x-12 pointer-events-none z-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          <div className="max-w-md w-full mx-auto my-auto space-y-6">
            <div className="space-y-1.5 text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Selamat Datang Kembali
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Masuk ke akun Anda untuk mengakses kunci digital dan reservasi ruangan.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">{loginError}</p>
                  {unverifiedEmail && (
                    <Link
                      href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&type=register`}
                      className="inline-flex items-center gap-1 font-bold text-rose-700 hover:underline pt-0.5"
                    >
                      <span>Verifikasi Email Sekarang &rarr;</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {loginSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="font-medium">{loginSuccess}</p>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700">
                  Alamat Email
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setForgotError(null);
                      setForgotModalOpen(true);
                    }}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold hover:underline cursor-pointer"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                  />
                  <input
                    type={loginShowPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginShowPassword(!loginShowPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                  >
                    <FontAwesomeIcon icon={loginShowPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={loginRememberMe}
                    onChange={(e) => setLoginRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>Ingat saya di perangkat ini</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loginLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500">
              <span>Belum memiliki akun? </span>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
              >
                Daftar Sekarang
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} WorkNest Technologies Inc.
          </div>
        </div>

        <div
          className="absolute inset-y-0 left-0 w-1/2 z-20 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] p-8 xl:p-12 2xl:p-14 flex flex-col justify-between overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.25)]"
          style={{
            transform: mode === "login" ? "translateX(0%)" : "translateX(100%)",
          }}
        >
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <img
              src="/login.png"
              alt="WorkNest Login Workspace"
              className={`w-full h-full object-cover object-center absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] scale-[1.01] ${
                mode === "login" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            />
            <img
              src="/register.png"
              alt="WorkNest Register Workspace"
              className={`w-full h-full object-cover object-center absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] scale-[1.01] ${
                mode === "register" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-slate-950/50" />
          </div>

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-12 h-12 flex items-center justify-center text-white shadow-sm shadow-sky-600/30 group-hover:bg-sky-500 transition-colors">
                <img
                  src="/logo-worknest.png"
                  alt="WorkNest Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </Link>
          </div>
          <div className="relative z-10 space-y-5 my-auto max-w-lg text-white">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight transition-all duration-500 drop-shadow-sm">
              {mode === "login" ? (
                <>
                  Akses Ruang Kerja Cerdas <br />
                  <span className="text-sky-400">Tanpa Hambatan</span> Resepsionis.
                </>
              ) : registerRole === "owner" ? (
                <>
                  Monetisasi Properti <br />
                  <span className="text-sky-400">dengan Otomasi IoT.</span>
                </>
              ) : (
                <>
                  Ruang Kerja Fleksibel <br />
                  <span className="text-sky-400">untuk Produktivitas Maksimal.</span>
                </>
              )}
            </h2>

            <p className="text-sm text-slate-200 leading-relaxed transition-all duration-500 drop-shadow-sm">
              {mode === "login"
                ? "Satu akun untuk membuka kunci turnstile, memesan ruang rapat 4K, hingga mengelola workspace korporat Anda secara instan."
                : registerRole === "owner"
                ? "Tingkatkan okupansi ruang kantor kosong Anda. Nikmati integrasi sistem kunci pintar tanpa butuh resepsionis standby 24 jam."
                : "Pesan meja kerja ergonomis, meeting room 4K, hingga private office dalam hitungan detik dengan verifikasi otomatis."}
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-slate-900/60 border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
                  <FontAwesomeIcon icon={faKey} className="w-3 h-3" />
                </div>
                <span>Buka pintu turnstile &amp; smart lock instan (&lt; 1.2 detik)</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-slate-900/60 border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
                  <FontAwesomeIcon icon={faChair} className="w-3 h-3" />
                </div>
                <span>Akses ribuan meja kerja &amp; meeting suite di berbagai kota</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-slate-900/60 border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
                  <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3" />
                </div>
                <span>Pembayaran QRIS/VA aman &amp; invoice resmi terbit otomatis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden min-h-screen flex flex-col justify-between p-6 sm:p-8 bg-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faBuilding} className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 text-base">WorkNest</span>
          </Link>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                mode === "login" ? "bg-white text-sky-700 shadow-xs" : "text-slate-600"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                mode === "register" ? "bg-white text-sky-700 shadow-xs" : "text-slate-600"
              }`}
            >
              Daftar
            </button>
          </div>
        </div>

        <div className="my-auto py-6">
          {mode === "login" ? (
            <div className="space-y-5">
              <div className="space-y-1 text-left">
                <h1 className="text-2xl font-extrabold text-slate-900">Selamat Datang Kembali</h1>
                <p className="text-xs text-slate-500">Masuk untuk mengakses kunci digital dan reservasi ruangan.</p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-slate-700">Kata Sandi</label>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-xs text-sky-600 hover:underline"
                    >
                      Lupa?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {loginLoading ? "Memverifikasi..." : "Masuk ke Akun"}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1 text-left">
                <h1 className="text-2xl font-extrabold text-slate-900">Buat Akun WorkNest</h1>
                <p className="text-xs text-slate-500">Mulai reservasi ruangan atau daftarkan coworking Anda.</p>
              </div>

              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kata Sandi</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {regLoading ? "Memproses..." : "Daftar Akun"}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="text-center text-[11px] text-slate-400">
          &copy; {new Date().getFullYear()} WorkNest Technologies Inc.
        </div>
      </div>

      {forgotModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setForgotModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 relative animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Reset Kata Sandi</h3>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Masukkan alamat email akun Anda. Kami akan mengirimkan instruksi kode 6-digit untuk penyetelan ulang kata sandi.
            </p>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Akun</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {forgotLoading ? "Mengirim..." : "Kirim Kode Verifikasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
