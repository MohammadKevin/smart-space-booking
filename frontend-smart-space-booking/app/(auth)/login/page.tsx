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
  Users,
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
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-slate-50">
      <div className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Live Operational Workspace Snapshot */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-700 shadow-xs flex items-center justify-center bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-web.png" alt="SmartSpace" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-base tracking-tight text-white">SmartSpace</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Sistem Reservasi & Okupansi Ruang Kerja
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Akses digital terpadu untuk Member, Pengelola Ruangan (Owner), dan Staff Operasional di lokasi.
              </p>
            </div>

            {/* Live Operational Status Strip */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400">
                Alur Akses Sistem:
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-300">Member</span>
                  <span className="font-mono font-semibold text-sky-400">Pesan & Tiket QR</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-300">Space Owner</span>
                  <span className="font-mono font-semibold text-sky-400">Inventory & Finansial</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-300">Staff Resepsionis</span>
                  <span className="font-mono font-semibold text-emerald-400">Validasi Check-In</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 relative z-10 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Live REST API Hub</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <Activity className="w-3 h-3" />
              Sistem Aktif
            </span>
          </div>
        </div>

        {/* Right Side: Clean Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Masuk ke Akun
              </h1>
              <p className="text-xs text-slate-500">
                Gunakan kredensial akun terdaftar Anda untuk melanjutkan.
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
                    placeholder="Masukkan username"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
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
                    className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Belum memiliki akun?{" "}
              <Link
                href="/register"
                className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
              >
                Daftar (Member atau Space Owner)
              </Link>
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
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-slate-50">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
