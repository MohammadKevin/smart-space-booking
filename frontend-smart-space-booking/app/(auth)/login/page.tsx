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
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-white grid grid-cols-1 lg:grid-cols-12">
      {/* Left Side: Brand Showcase & Operational Highlight (Full-height Cyan Panel) */}
      <div className="lg:col-span-5 bg-gradient-to-br from-cyan-50/90 via-sky-50/60 to-blue-50/30 border-b lg:border-b-0 lg:border-r border-cyan-100 p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Logo & Live Signal Badge */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-cyan-200 shadow-xs flex items-center justify-center bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-web.png" alt="SmartSpace" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-slate-900 text-base tracking-tight">SmartSpace</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-cyan-200 text-cyan-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live System
            </span>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Satu Pintu Masuk untuk Seluruh Operasional Ruang Kerja
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Akses cepat dan aman untuk Member, Pengelola Ruangan (Owner), serta Staff Resepsionis di lokasi.
            </p>
          </div>

          {/* Role Access Matrix Cards */}
          <div className="space-y-2.5 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-white border border-cyan-100/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-600" />
                  Portal Member
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                  Tiket QR Mandiri
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Pesan workstation & meeting room secara real-time, pantau riwayat, dan akses tiket QR digital.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-cyan-100/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                  Portal Space Owner
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  Manajemen & Finansial
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Kelola data inventaris ruangan, konfigurasi tarif per jam, kelola tim staff, dan pantau grafik omzet.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-cyan-100/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-cyan-600" />
                  Terminal Staff
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Scanner Resepsionis
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Pemindai tiket QR instan dan validasi check-in/check-out reservasi pengunjung langsung di meja depan.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="pt-8 border-t border-cyan-200/60 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            Keamanan Terenkripsi JWT
          </span>
          <span className="font-mono text-slate-400">UKK RPL 2026</span>
        </div>
      </div>

      {/* Right Side: Full Screen Pure White Login Form */}
      <div className="lg:col-span-7 bg-white p-6 sm:p-12 lg:p-16 flex flex-col justify-center max-w-lg mx-auto w-full space-y-6">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke Akun
            </h2>
            <p className="text-xs text-slate-500">
              Gunakan kredensial akun Anda untuk mengakses dashboard dan layanan reservasi.
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
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700"
              >
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-cyan-500 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
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
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-cyan-500 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-600/30 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
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
              Daftar gratis (Member atau Space Owner)
            </Link>
          </p>

          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Compass className="w-3 h-3" />
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

