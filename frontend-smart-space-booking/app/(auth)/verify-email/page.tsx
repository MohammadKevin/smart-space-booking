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
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
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
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Handle paste of full 6 digit string
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

    // Auto advance to next input
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
    if (!email.trim()) {
      setErrorMessage("Alamat email tidak boleh kosong.");
      return;
    }
    if (fullOtp.length !== 6) {
      setErrorMessage("Silakan lengkapi 6-digit kode OTP.");
      return;
    }

    setLoading(true);

    try {
      if (typeParam === "reset") {
        if (!newPassword) {
          setErrorMessage("Masukkan kata sandi baru.");
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setErrorMessage("Kata sandi baru minimal 6 karakter.");
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setErrorMessage("Konfirmasi kata sandi baru tidak cocok.");
          setLoading(false);
          return;
        }

        const res = await resetPassword({
          email: email.trim(),
          otp: fullOtp,
          password: newPassword,
        });

        setSuccessMessage(res.message || "Kata sandi berhasil diperbarui! Mengarahkan ke login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        const res = await verifyEmail({
          email: email.trim(),
          otp: fullOtp,
        });

        loginUser(res.access_token, res.user);
        setSuccessMessage("Verifikasi email berhasil! Mengarahkan ke dashboard...");

        setTimeout(() => {
          const role = res.user.role?.toLowerCase();
          if (role === "admin_space" || role === "owner") {
            router.push("/dashboard/owner");
          } else if (role === "staff") {
            router.push("/dashboard/staff");
          } else {
            router.push("/dashboard/member");
          }
        }, 1000);
      }
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    if (!email.trim()) {
      setErrorMessage("Masukkan email untuk mengirim ulang kode.");
      return;
    }

    setResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await resendOtp({
        email: email.trim(),
        type: typeParam === "reset" ? "forgot_password" : "register",
      });

      setSuccessMessage(res.message || "Kode OTP baru telah dikirimkan ke email Anda.");
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50/70 text-slate-900">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Login</span>
          </Link>
          <span className="text-[11px] font-semibold text-slate-400">WorkNest Security</span>
        </div>

        {/* Card Container */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto border border-slate-200">
              {typeParam === "reset" ? (
                <KeyRound className="w-6 h-6 text-slate-700" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-slate-700" />
              )}
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {typeParam === "reset" ? "Reset Kata Sandi" : "Verifikasi Alamat Email"}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {typeParam === "reset"
                ? "Masukkan 6-digit kode OTP yang dikirimkan ke email dan buat kata sandi baru Anda."
                : "Masukkan 6-digit kode OTP yang telah dikirimkan ke email Anda untuk mengaktifkan akun."}
            </p>
            {email && (
              <p className="text-xs font-mono font-bold text-slate-800 bg-slate-50 py-1 px-2.5 rounded-md border border-slate-200/80 inline-block">
                {email}
              </p>
            )}
          </div>

          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center gap-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200/80 flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            {!emailParam && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>
            )}

            {/* 6 Digit OTP Inputs */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 text-center">
                Kode Verifikasi OTP (6 Digit)
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
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
                    className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-mono font-extrabold bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-lg text-slate-900 focus:outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* If Reset Password, Show New Password Inputs */}
            {typeParam === "reset" && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg text-xs text-slate-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>{typeParam === "reset" ? "Reset Kata Sandi" : "Konfirmasi & Masuk"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend OTP Section */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tidak menerima kode?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="font-semibold text-slate-800 hover:text-slate-900 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer flex items-center gap-1"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
                  <span>Mengirim...</span>
                </>
              ) : resendCooldown > 0 ? (
                <span>Kirim Ulang ({resendCooldown}s)</span>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 text-slate-600" />
                  <span>Kirim Ulang OTP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
