"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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
  QrCode,
  Activity,
  ShieldCheck,
  Compass,
  Sparkles,
  Check,
  Clock,
  MapPin,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { loginUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        username: username.trim(),
        password,
      });

      loginUser(response.access_token, response.user);
      setSuccessMessage("Login berhasil. Mengarahkan ke dashboard...");

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
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-white grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
      {/* Left Side: Architectural Showcase Panel with Live QR Card Mockup */}
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
          {/* Logo & Live Signal Badge */}
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
                  Booking Platform
                </span>
              </div>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/90 backdrop-blur-xs border border-cyan-200/80 text-cyan-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Akses Satu Pintu untuk Seluruh Ruang Kerja Cerdas
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Solusi reservasi terpadu untuk Member, Pengelola Ruangan (Owner), serta Scanner Validasi Staff di lokasi.
            </p>
          </div>

          {/* Realistic Live Product Mockup: Digital QR Ticket Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-white/95 backdrop-blur-md border border-cyan-200/90 shadow-md shadow-cyan-950/5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    E-Ticket Simulasi
                  </p>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    Executive Meeting Room 01
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="w-2.5 h-2.5" />
                Terverifikasi
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                  <Clock className="w-3 h-3 text-cyan-600" />
                  Durasi Sewa
                </span>
                <span className="font-semibold text-slate-800">Hari ini, 3 Jam</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                  <MapPin className="w-3 h-3 text-cyan-600" />
                  Lokasi
                </span>
                <span className="font-semibold text-slate-800 truncate block">Kuncie Hub Malang</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
              <span>KODE: SSB-2026-QR</span>
              <span className="text-cyan-700 font-sans font-semibold">Siap Check-in di Meja Depan</span>
            </div>
          </div>

          {/* Access Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-white/70 border border-cyan-100/80">
              <span className="block font-bold text-slate-900 text-xs">Member</span>
              <span className="text-[10px] text-cyan-700 font-medium">Tiket QR</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/70 border border-cyan-100/80">
              <span className="block font-bold text-slate-900 text-xs">Owner</span>
              <span className="text-[10px] text-cyan-700 font-medium">Omzet & Ruang</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/70 border border-cyan-100/80">
              <span className="block font-bold text-slate-900 text-xs">Staff</span>
              <span className="text-[10px] text-emerald-700 font-medium">QR Scanner</span>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="pt-8 border-t border-cyan-200/60 text-[11px] text-slate-500 flex items-center justify-between relative z-10">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            Terkoneksi API Terenkripsi
          </span>
          <span className="font-mono text-slate-400">UKK RPL 2026</span>
        </div>
      </div>

      {/* Right Side: Ultra Clean Pure White Login Form */}
      <div className="lg:col-span-7 bg-white p-6 sm:p-12 lg:p-16 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 mb-1">
              <Sparkles className="w-3 h-3 text-cyan-600" />
              <span>Portal Masuk Autentikasi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke Akun
            </h2>
            <p className="text-xs text-slate-500">
              Masukkan kredensial akun terdaftar Anda untuk melanjutkan ke dashboard.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs shadow-2xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="font-medium leading-relaxed">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700"
              >
                Username Akun
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white hover:bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/25 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Belum memiliki akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
            >
              Daftar gratis (Member / Owner)
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-white">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}


