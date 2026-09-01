"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail, resendVerificationOtp, getApiErrorMessage } from "@/lib/api";
import {
  MailCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Building2,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || searchParams.get("username") || "user@example.com";
  const roleParam = searchParams.get("role") || "member";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // 60 seconds cooldown timer
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    // If user typed single digit
    if (cleanValue.length === 1) {
      newOtp[index] = cleanValue;
      setOtp(newOtp);
      // Auto move to next input
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // If user typed/pasted multiple digits
      const digits = cleanValue.slice(0, 6).split("");
      digits.forEach((d, i) => {
        if (index + i < 6) {
          newOtp[index + i] = d;
        }
      });
      setOtp(newOtp);
      const nextFocus = Math.min(5, index + digits.length);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move back on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const focusIndex = Math.min(5, pastedData.length);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setErrorMessage("Silakan masukkan 6 digit kode verifikasi lengkap");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmail({
        email: emailParam,
        otp: fullOtp,
      });

      setIsVerified(true);
      setSuccessMessage(res.message || "Email berhasil diverifikasi! Mengalihkan ke halaman Login...");

      setTimeout(() => {
        router.push(`/login?verified=true&email=${encodeURIComponent(emailParam)}`);
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await resendVerificationOtp(emailParam);
      setSuccessMessage(res.message || "Kode OTP baru telah berhasil dikirimkan ke email Anda.");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 space-y-6">
        {/* Header Icon */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shadow-sm animate-in zoom-in-95">
            <MailCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Verifikasi Akun Email
          </h1>
          <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
            Masukkan 6 digit kode OTP yang telah dikirimkan ke alamat email / akun Anda:
          </p>
          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
            {emailParam}
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-700 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            <div className="leading-snug">{successMessage}</div>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Digit Boxes */}
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
                disabled={isVerified || loading}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-sky-500 rounded-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all shadow-sm disabled:opacity-50"
              />
            ))}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading || isVerified || otp.join("").length < 6}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi Kode OTP...</span>
              </>
            ) : isVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Terverifikasi! Mengalihkan...</span>
              </>
            ) : (
              <>
                <span>Verifikasi Email & Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Code Section */}
        <div className="pt-3 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Tidak menerima kode verifikasi?
          </p>
          {countdown > 0 ? (
            <p className="text-xs font-semibold text-slate-400">
              Kirim ulang kode dalam{" "}
              <span className="text-sky-600 font-bold font-mono">
                {String(Math.floor(countdown / 60)).padStart(2, "0")}:
                {String(countdown % 60).padStart(2, "0")}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline transition-colors focus:outline-none"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Kirim Ulang Kode OTP</span>
            </button>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center pt-1">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Masuk</span>
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
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
