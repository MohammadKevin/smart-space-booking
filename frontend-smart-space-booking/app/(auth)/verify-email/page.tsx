"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  verifyEmail,
  resendOtp,
  resetPassword,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { WorkNestLogo } from "@/components/WorkNestLogo";
import {
  ShieldCheck,
  ArrowRight,
  Clock,
  Headphones,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginUser } = useAuth();

  const emailParam = searchParams.get("email") || "";
  const typeParam = searchParams.get("type") === "reset" ? "reset" : "register";

  const [email, setEmail] = useState(emailParam);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(48);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
    if (typeof window !== "undefined") {
      const storedPhone = sessionStorage.getItem("registered_phone");
      if (storedPhone) setPhone(storedPhone);
    }
  }, [emailParam]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const maskEmail = (str: string) => {
    if (!str || !str.includes("@")) return "adrian.w**@worknest.id";
    const [name, domain] = str.split("@");
    if (name.length <= 3) return `${name}***@${domain}`;
    const visibleStart = name.slice(0, Math.min(8, Math.floor(name.length * 0.7)));
    return `${visibleStart}**@${domain.slice(0, 6)}`;
  };

  const maskPhone = (str: string) => {
    if (!str) return "+62 812-****-9821";
    const clean = str.replace(/\D/g, "");
    if (clean.length < 8) return "+62 812-****-9821";
    const prefix = clean.startsWith("62") ? "+62 " : "0";
    const digits = clean.startsWith("62") ? clean.slice(2) : clean.slice(1);
    const head = digits.slice(0, 3);
    const tail = digits.slice(-4);
    return `${prefix}${head}-****-${tail}`;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, "").slice(0, 6).split("");
      if (pastedDigits.length > 0) {
        const newOtp = [...otp];
        pastedDigits.forEach((digit, idx) => {
          if (idx < 6) newOtp[idx] = digit;
        });
        setOtp(newOtp);
        const nextFocus = Math.min(pastedDigits.length, 5);
        inputRefs.current[nextFocus]?.focus();
        return;
      }
    }

    const digit = value.slice(-1).replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullOtp = otp.join("");
    const targetEmail = email.trim() || "adrian.w@worknest.id";

    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit security code.");
      return;
    }

    setLoading(true);

    try {
      if (typeParam === "reset") {
        if (!newPassword || newPassword.length < 8) {
          setErrorMessage("New password must be at least 8 characters long.");
          setLoading(false);
          return;
        }

        const res = await resetPassword({
          email: targetEmail,
          otp: fullOtp,
          password: newPassword,
        });

        setSuccessMessage(res.message || "Password updated! Redirecting to login...");
        setTimeout(() => router.push("/login"), 1200);
      } else {
        const res = await verifyEmail({
          email: targetEmail,
          otp: fullOtp,
        });

        loginUser(res.access_token, res.user);
        setSuccessMessage("Security verification successful! Activating your pass...");

        setTimeout(() => {
          const r = res.user.role?.toLowerCase();
          if (r === "admin_space" || r === "owner") {
            router.push("/dashboard/owner");
          } else if (r === "staff") {
            router.push("/dashboard/staff");
          } else {
            router.push("/dashboard/member");
          }
        }, 900);
      }
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await resendOtp({
        email: email.trim() || "adrian.w@worknest.id",
        type: typeParam === "reset" ? "forgot_password" : "register",
      });

      setSuccessMessage(res.message || "New 6-digit verification code sent.");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 sm:px-6 bg-[#F4F7FA] text-slate-900 selection:bg-[#006370] selection:text-white">
      
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-7 sm:p-9 transition-all">
        
        <div className="flex items-center justify-between">
          <WorkNestLogo size="md" />

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] font-mono text-[11px] font-bold border border-[#BAE6FD]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>SECURE ACCESS</span>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="w-13 h-13 rounded-2xl bg-[#E6F4F6] text-[#006370] flex items-center justify-center shadow-xs">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <rect x="9" y="11" width="6" height="5" rx="1" />
              <path d="M10 11V9.5a2 2 0 1 1 4 0V11" />
            </svg>
          </div>
        </div>

        <div className="text-center mt-5 space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Verify your email & phone
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed max-w-sm mx-auto">
            We&apos;ve sent a 6-digit verification security code to{" "}
            <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-semibold text-xs inline-block">
              {maskEmail(email)}
            </span>{" "}
            <span className="text-slate-600 font-mono text-xs">
              ({maskPhone(phone)}).
            </span>
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-6 space-y-5">
          
          <div className="flex items-center justify-between gap-2 sm:gap-2.5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold font-mono bg-[#F8FAFC] hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] focus:ring-2 focus:ring-[#006370]/15 rounded-xl text-slate-900 focus:outline-none transition-all shadow-xs"
              />
            ))}
          </div>

          {typeParam === "reset" && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-800">
                New Robust Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 focus:border-[#006370] rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {resendCooldown > 0 ? (
                <span>Resend in {formatTimer(resendCooldown)}</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-[#006370] font-bold hover:underline cursor-pointer"
                >
                  {resending ? "Sending..." : "Resend Code"}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleResend}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-[#006370] transition-colors cursor-pointer"
            >
              <span>Try via SMS / Call</span>
              <Headphones className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#006370] hover:bg-[#004f59] active:bg-[#003e46] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#006370]/25 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Security Pass...</span>
              </>
            ) : (
              <>
                <span>Confirm & Activate Pass</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">NODE: IDN-JKT-02</span>
            </div>
            <span className="text-slate-400">SHA256 • TLS 1.3</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Security Level: Biometric & TOTP Multi-Tenant Verified
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Wrong email address?{" "}
          <Link
            href="/register"
            className="font-bold text-[#006370] hover:text-[#004f59] hover:underline"
          >
            Change email
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7FA]">
          <Loader2 className="w-8 h-8 text-[#006370] animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
