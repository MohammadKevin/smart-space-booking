"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, forgotPassword, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
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
  ShieldCheck,
  Share2,
  Link2,
  X,
  KeyRound,
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
  const [ssoModalOpen, setSsoModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setUnverifiedEmail(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your work email");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await login({
        email: email.trim(),
        password,
      });

      loginUser(response.access_token, response.user);
      setSuccessMessage("Authentication successful. Routing to your console...");

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
          if (role === "member" && redirectParam.startsWith("/dashboard/checkin")) {
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
      if (err.response?.data?.isVerified === false || msg.toLowerCase().includes("verifikasi")) {
        setUnverifiedEmail(email.trim());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your account email.");
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
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 bg-slate-50/60 relative">
      {/* Top Protocol Pill */}
      <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs text-[11px] font-mono font-medium tracking-wide text-slate-600">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="uppercase text-slate-500 font-semibold">Identity Gateway</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-600">ID.WORKNEST.IO</span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-9 relative">
        {/* WorkNest Emblem Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-[#E6F4F2] border border-[#BCE3DE] flex items-center justify-center mb-4 text-[#0D5C63]">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight mb-2">
            Welcome back to WorkNest
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
            Sign in to access your digital keys, bookings, and invoices.
          </p>
        </div>

        {/* Google Workspace Auth */}
        <div className="mb-5">
          <GoogleLoginButton
            label="Continue with Google Workspace"
            onError={(err) => setErrorMessage(err)}
          />
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-xs text-slate-400 font-normal">
            or enter work credentials
          </span>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col gap-2 text-rose-800 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
            {unverifiedEmail && (
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&type=register`}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md shadow-2xs transition-colors self-start text-[11px]"
              >
                <span>Verify Email Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Work Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0D5C63] focus:ring-2 focus:ring-[#0D5C63]/15 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError(null);
                  setForgotModalOpen(true);
                }}
                className="text-xs text-[#0D5C63] hover:text-[#09474D] font-medium hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0D5C63] focus:ring-2 focus:ring-[#0D5C63]/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Auto-routing engine callout */}
          <div className="p-3 bg-[#F4FAF9] border border-[#CDEAE6] rounded-xl flex items-start gap-2.5 text-[11px] sm:text-xs text-slate-700 leading-relaxed">
            <Share2 className="w-4 h-4 text-[#0D5C63] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#0D5C63] font-semibold">Auto-routing engine:</strong> Detects Member, Space Host, or Super Admin permissions upon sign-in.
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="remember-device"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#0D5C63] focus:ring-[#0D5C63] cursor-pointer"
            />
            <label htmlFor="remember-device" className="text-xs text-slate-600 cursor-pointer select-none">
              Remember this device for 30 days
            </label>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-medium text-xs sm:text-sm text-white bg-[#0D5C63] hover:bg-[#09474D] active:bg-[#07363B] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Workspace...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer inside card */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-2 text-center text-xs text-slate-500">
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#0D5C63] font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
          <button
            type="button"
            onClick={() => setSsoModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium py-1 px-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer mt-1"
          >
            <Link2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign in with SSO / SAML 2.0</span>
          </button>
        </div>
      </div>

      {/* Under card footer */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 max-w-[480px] w-full px-2">
        <div className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>256-BIT TLS ENCRYPTED</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="#" className="hover:text-slate-600 transition-colors">Privacy</Link>
          <span>•</span>
          <Link href="#" className="hover:text-slate-600 transition-colors">Terms</Link>
          <span>•</span>
          <Link href="#" className="hover:text-slate-600 transition-colors">Support</Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E6F4F2] text-[#0D5C63] flex items-center justify-center border border-[#BCE3DE]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Reset Account Password
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Send a recovery OTP code to your registered email
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{forgotError}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 focus:border-[#0D5C63] focus:ring-1 focus:ring-[#0D5C63]/20 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  We will send a 6-digit verification code to this address.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="py-2.5 px-4 bg-[#0D5C63] hover:bg-[#09474D] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Send OTP Code</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SSO Info Modal */}
      {ssoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E6F4F2] text-[#0D5C63] flex items-center justify-center border border-[#BCE3DE]">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Enterprise Single Sign-On
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    SAML 2.0 / Okta / Azure AD routing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSsoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              WorkNest enterprise accounts are automatically recognized. Simply enter your company work email in the primary sign-in form, or continue with Google Workspace to activate your federated identity session.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 font-mono">
              Supported protocols: SAML 2.0, OIDC, SCIM v2 provisioning
            </div>

            <button
              type="button"
              onClick={() => setSsoModalOpen(false)}
              className="w-full py-2.5 px-4 bg-[#0D5C63] hover:bg-[#09474D] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Got it
            </button>
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <Loader2 className="w-8 h-8 text-[#0D5C63] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
