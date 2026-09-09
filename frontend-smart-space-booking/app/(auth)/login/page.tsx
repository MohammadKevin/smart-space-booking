"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, forgotPassword, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Building2,
  Network,
  X,
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
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setUnverifiedEmail(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your work email.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await login({
        email: email.trim(),
        password,
      });

      loginUser(response.access_token, response.user);
      setSuccessMessage("Authentication successful. Routing to workspace...");

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
      setErrorMessage(msg);
      if (err.response?.data?.isVerified === false || msg.toLowerCase().includes("verifik")) {
        setUnverifiedEmail(email.trim());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address.");
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 sm:px-6 bg-[#FAFCFF] text-slate-900 relative selection:bg-[#006370] selection:text-white">
      
      <Link
        href="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-10 text-sm text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5"
      >
        <span>&larr;</span>
        <span>Kembali</span>
      </Link>

      <div className="w-full max-w-[480px] bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 p-7 sm:p-9 transition-all">
        
        <div className="flex flex-col items-center text-center">
          <div className="w-13 h-13 rounded-2xl bg-[#E0F2FE]/80 border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>

          <h1 className="font-serif text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight mt-5">
            Welcome back to WorkNest
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            Sign in to access your digital keys, bookings, and invoices.
          </p>
        </div>

        <div className="pt-4" />

        {errorMessage && (
          <div className="mb-4 p-3 rounded-[10px] bg-rose-50 border border-rose-200 flex flex-col gap-2 text-rose-800 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
            {unverifiedEmail && (
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&type=register`}
                className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md shadow-2xs transition-colors self-start text-[11px]"
              >
                <span>Verify Email Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-[10px] bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#006370] focus:ring-2 focus:ring-[#006370]/15 rounded-[10px] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-800">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError(null);
                  setForgotModalOpen(true);
                }}
                className="text-xs text-[#0284C7] hover:text-[#0369A1] font-medium hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 focus:border-[#006370] focus:ring-2 focus:ring-[#006370]/15 rounded-[10px] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer rounded"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-[#F0F9FF] border border-[#E0F2FE] flex items-start gap-2.5 text-xs text-slate-600">
            <Network className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              <strong className="text-slate-800">Auto-routing engine:</strong> Detects Member, Space Host, or Super Admin permissions upon sign-in.
            </span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#006370] focus:ring-[#006370] cursor-pointer"
            />
            <label
              htmlFor="remember-me"
              className="text-xs text-slate-600 cursor-pointer select-none"
            >
              Remember this device for 30 days
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-[10px] font-bold text-xs sm:text-sm text-white bg-[#006370] hover:bg-[#004f59] active:bg-[#003e46] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#006370]/25 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-[#006370] hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-400">
        <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
        <span>&bull;</span>
        <Link href="/terms" className="hover:text-slate-600">Terms</Link>
        <span>&bull;</span>
        <Link href="/support" className="hover:text-slate-600">Support</Link>
      </div>

      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Reset Account Password
              </h3>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Enter your registered work email
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#006370] rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-1.5 rounded-lg bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {forgotLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send OTP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAFCFF]">
          <Loader2 className="w-8 h-8 text-[#006370] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
