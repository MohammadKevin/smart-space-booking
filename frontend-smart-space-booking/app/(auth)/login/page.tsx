"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Lock,
  User,
  ArrowRight,
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

  const [username, setUsername] = useState("");
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

    if (!username.trim()) {
      setErrorMessage("Masukkan username Anda");
      return;
    }
    if (!password) {
      setErrorMessage("Masukkan kata sandi Anda");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      const response = await login({
        username: username.trim(),
        password,
      });

      loginUser(response.access_token, response.user);
      setSuccessMessage("Login berhasil! Mengarahkan ke dashboard...");

      setTimeout(() => {
        if (redirectParam) {
          router.push(redirectParam);
          return;
        }

        const role = response.user.role?.toLowerCase();
        if (role === "admin_space" || role === "owner") {
          router.push("/dashboard/owner");
        } else if (role === "staff") {
          router.push("/dashboard/staff");
        } else {
          router.push("/dashboard/member");
        }
      }, 600);
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center py-[50px] sm:py-[75px] px-4 sm:px-8 lg:px-12 bg-slate-100/80 relative overflow-hidden">
      {/* Ambient Decorative Background Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Diagonal Stripes Pattern in Top Right */}
      <div className="absolute top-6 right-8 opacity-20 pointer-events-none hidden sm:block">
        <div className="flex gap-2 transform -rotate-45">
          <div className="w-1.5 h-16 bg-cyan-600 rounded-full" />
          <div className="w-1.5 h-16 bg-cyan-600 rounded-full" />
          <div className="w-1.5 h-16 bg-cyan-600 rounded-full" />
          <div className="w-1.5 h-16 bg-cyan-600 rounded-full" />
        </div>
      </div>

      {/* Center 2-Column Pop-up Modal Card (Enlarged max-w-5xl / max-w-6xl) */}
      <div className="w-full max-w-5xl lg:max-w-6xl bg-white rounded-xl shadow-2xl shadow-slate-400/25 border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 min-h-[580px]">
        {/* Left Side: 3D Illustration & Headline */}
        <div className="lg:col-span-6 bg-gradient-to-br from-cyan-50/90 via-sky-50/50 to-blue-50/30 p-8 sm:p-10 lg:p-12 flex flex-col justify-between items-center text-center relative border-b lg:border-b-0 lg:border-r border-cyan-100/90">
          {/* Top Catchy Headline with Highlighted Accent Words */}
          <div className="space-y-2 max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
              Permudah interaksi antar{" "}
              <span className="text-cyan-600 font-extrabold">Member</span> dan{" "}
              <span className="text-sky-600 font-extrabold">Space Owner</span> secara online!
            </h2>
          </div>

          {/* Center 3D Illustration Graphic with Floating Badges */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-xl overflow-hidden shadow-xl shadow-cyan-900/10 border-2 border-white bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/auth-login-illustration.jpg"
                alt="SmartSpace Coworking Illustration"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating Top Left Badge */}
            <div className="absolute -top-3 -left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-cyan-200 shadow-md flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <QrCode className="w-4 h-4 text-cyan-600" />
              <span>Tiket QR</span>
            </div>

            {/* Floating Bottom Right Badge */}
            <div className="absolute -bottom-3 -right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-cyan-200 shadow-md flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Check-in Cepat</span>
            </div>
          </div>

          {/* Bottom Live Subtitle */}
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistem Reservasi & Okupansi Fisik Terpadu</span>
          </div>
        </div>

        {/* Right Side: Clean Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-center space-y-6">
          <div className="space-y-6 max-w-md mx-auto w-full">
            {/* Top Brand Logo */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs flex items-center justify-center bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon-web.png" alt="SmartSpace" className="w-full h-full object-cover" />
                </div>
                <span className="font-extrabold text-slate-900 text-xl tracking-tight">
                  SmartSpace
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-1">
                Hai, selamat datang kembali
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Baru di SmartSpace?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
                >
                  Daftar Gratis
                </Link>
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: kevin.member"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi kamu"
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

                <Link
                  href="/"
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </form>
          </div>

          {/* Footer Terms Note */}
          <div className="pt-4 border-t border-slate-100 text-center max-w-md mx-auto w-full">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dengan melanjutkan, kamu menyetujui{" "}
              <span className="text-cyan-600 font-medium">Syarat Penggunaan</span> dan{" "}
              <span className="text-cyan-600 font-medium">Kebijakan Privasi</span> SmartSpace.
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
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-slate-100">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}



