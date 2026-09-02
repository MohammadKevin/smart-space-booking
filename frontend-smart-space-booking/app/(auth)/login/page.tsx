"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Compass,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { loginUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Masukkan email Anda");
      return;
    }
    if (!password) {
      setErrorMessage("Masukkan password Anda");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      const response = await login({
        email: email.trim(),
        password,
      });

      loginUser(response.access_token, response.user);
      setSuccessMessage("Login berhasil! Mengarahkan ke dashboard...");

      setTimeout(() => {
        const role = response.user.role?.toLowerCase();
        const isOwner = role === "admin_space" || role === "owner";
        const isStaff = role === "staff";
        const defaultDashboard = isOwner
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
          if (role === "member" && redirectParam.startsWith("/dashboard/checkin")) {
            router.push(defaultDashboard);
            return;
          }
          router.push(redirectParam);
          return;
        }

        router.push(defaultDashboard);
      }, 500);
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
              Permudah interaksi antar{" "}
              <span className="text-cyan-600 font-extrabold">Member</span> dan{" "}
              <span className="text-sky-600 font-extrabold">Space Owner</span> secara online!
            </h2>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-68 h-68 sm:w-76 sm:h-76 rounded-xl overflow-hidden shadow-xl shadow-cyan-900/10 border-2 border-white bg-white">
              <img
                src="/auth-login-illustration.jpg"
                alt="SmartSpace Coworking Illustration"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute -top-3 -left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-cyan-200 shadow-md flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <QrCode className="w-4 h-4 text-cyan-600" />
              <span>Tiket QR</span>
            </div>

            <div className="absolute -bottom-3 -right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-cyan-200 shadow-md flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Check-in Cepat</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistem Reservasi & Okupansi Fisik Terpadu</span>
          </div>
        </div>

        <div className="lg:col-span-6 p-8 sm:p-10 lg:p-12 flex flex-col justify-between h-full overflow-y-auto">
          <div className="space-y-5 max-w-md mx-auto w-full my-auto">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs flex items-center justify-center bg-white">
                  <img src="/icon-web.png" alt="WorkNest" className="w-full h-full object-cover" />
                </div>
                <span className="font-extrabold text-slate-900 text-xl tracking-tight">
                  WorkNest
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-1">
                Hai, selamat datang kembali
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Baru di WorkNest?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
                >
                  Daftar Sekarang
                </Link>
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
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
                    placeholder="Masukkan password kamu"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 px-4 rounded-lg font-semibold text-xs sm:text-sm text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-600/30 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer"
                  />
                  <span>Ingat perangkat ini</span>
                </label>
              </div>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center max-w-md mx-auto w-full">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dengan melanjutkan, kamu menyetujui{" "}
              <span className="text-cyan-600 font-medium">Syarat Penggunaan</span> dan{" "}
              <span className="text-cyan-600 font-medium">Kebijakan Privasi</span> WorkNest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}



