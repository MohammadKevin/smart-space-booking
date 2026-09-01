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
  ShieldCheck,
  Building,
  Users,
  UserCheck,
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
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validation
    if (!username.trim()) {
      setErrorMessage("Username tidak boleh kosong");
      return;
    }
    if (!password) {
      setErrorMessage("Password tidak boleh kosong");
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
        password: password,
      });

      loginUser(response.access_token, response.user);
      setSuccessMessage("Login berhasil! Mengalihkan...");

      // Role-based routing
      setTimeout(() => {
        if (redirectParam) {
          router.push(redirectParam);
          return;
        }

        const role = response.user.role.toLowerCase();
        if (role === "admin_space" || role === "owner") {
          router.push("/dashboard/spaces");
        } else if (role === "staff") {
          router.push("/dashboard/checkin");
        } else {
          // member
          router.push("/spaces");
        }
      }, 700);
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shadow-sm">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Selamat Datang Kembali
        </h1>
        <p className="text-sm text-slate-500">
          Masuk ke akun SmartSpace Anda (Member, Owner, atau Staff).
        </p>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="leading-snug">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-700 text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
          <div className="leading-snug">{successMessage}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
          >
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username Anda"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memverifikasi Akun...</span>
            </>
          ) : (
            <>
              <span>Masuk Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Role Routing Info */}
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
          <span>Sistem Otomatis Mendeteksi 3 Role:</span>
        </div>
        <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] text-center">
          <div className="p-1.5 rounded-lg bg-white border border-slate-200">
            <span className="font-bold text-sky-700 block">Member</span>
            <span className="text-slate-400 text-[10px]">Booking</span>
          </div>
          <div className="p-1.5 rounded-lg bg-white border border-slate-200">
            <span className="font-bold text-sky-700 block">Owner</span>
            <span className="text-slate-400 text-[10px]">Kelola Space</span>
          </div>
          <div className="p-1.5 rounded-lg bg-white border border-slate-200">
            <span className="font-bold text-sky-700 block">Staff</span>
            <span className="text-slate-400 text-[10px]">Scan QR</span>
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-600">
          Belum memiliki akun?{" "}
          <Link
            href="/register"
            className="font-bold text-sky-600 hover:text-sky-700 hover:underline"
          >
            Daftar Sekarang (Member & Owner)
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12 bg-slate-50">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
