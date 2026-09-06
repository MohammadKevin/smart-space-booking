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
  QrCode,
  Sparkles,
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

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

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
    <div className="min-h-screen flex items-center justify-center py-[50px] sm:py-[75px] px-4 sm:px-8 lg:px-12 bg-slate-100/80 relative overflow-hidden">
      <Link
        href="/login"
        className="absolute top-5 left-5 sm:top-7 sm:left-8 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/95 hover:bg-white text-slate-700 hover:text-cyan-700 font-semibold text-xs border border-slate-200 shadow-xs hover:shadow-md hover:border-cyan-300 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-600 transition-transform group-hover:-translate-x-0.5" />
        <span>Kembali ke Login</span>
      </Link>

      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl lg:max-w-6xl bg-white rounded-xl shadow-2xl shadow-slate-400/25 border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 lg:h-[640px]">
        {/* Left Column (Illustration & Security Banner) */}
        <div className="lg:col-span-6 bg-gradient-to-br from-cyan-50/90 via-sky-50/50 to-blue-50/30 p-8 sm:p-10 lg:p-12 flex flex-col justify-between items-center text-center relative border-b lg:border-b-0 lg:border-r border-cyan-100/90 h-full">
          <div className="space-y-2 max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
              Keamanan Akun Terjamin dengan{" "}
              <span className="text-cyan-600 font-extrabold">Verifikasi 2 Langkah</span> & OTP
            </h2>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-68 h-68 sm:w-76 sm:h-76 rounded-xl overflow-hidden shadow-xl shadow-cyan-900/10 border-2 border-white bg-white">
              <img
                src="/auth-register-illustration.jpg"
                alt="Security Verification Illustration"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute -top-3 -left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-cyan-200 shadow-md flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span>Proteksi Akun</span>
            </div>

            <div className="absolute -bottom-3 -right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-cyan-200 shadow-md flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Enkripsi Aman</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistem Autentikasi Real-Time WorkNest</span>
          </div>
        </div>

        {/* Right Column (Verification Form) */}
        <div className="lg:col-span-6 p-8 sm:p-10 lg:p-12 flex flex-col justify-between h-full overflow-y-auto">
          <div className="space-y-5 max-w-md mx-auto w-full my-auto">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs flex items-center justify-center bg-white">
                  <img src="/icon-web.png" alt="WorkNest" className="w-full h-full object-cover" />
                </div>
                <span className="font-extrabold text-slate-900 text-xl tracking-tight">
                  WorkNest
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-1">
                {typeParam === "reset" ? "Reset Kata Sandi" : "Verifikasi Alamat Email"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {typeParam === "reset"
                  ? "Masukkan 6-digit kode OTP yang dikirimkan ke email dan buat kata sandi baru Anda."
                  : "Masukkan 6-digit kode OTP yang telah dikirimkan ke email Anda untuk mengaktifkan akun."}
              </p>
              {email && (
                <p className="text-xs font-mono font-bold text-cyan-800 bg-cyan-50/80 py-1 px-3 rounded-md border border-cyan-200/70 inline-block">
                  {email}
                </p>
              )}
            </div>

            {successMessage && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              {!emailParam && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none transition-all font-mono"
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
                      className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-mono font-extrabold bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15 rounded-lg text-slate-900 focus:outline-none transition-all shadow-2xs"
                    />
                  ))}
                </div>
              </div>

              {/* Reset Password Form Inputs */}
              {typeParam === "reset" && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 karakter"
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none transition-all"
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

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 px-4 rounded-lg font-semibold text-xs sm:text-sm text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-600/30 cursor-pointer mt-2"
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

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Tidak menerima kode?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer flex items-center gap-1"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-600" />
                    <span>Mengirim...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span>Kirim Ulang ({resendCooldown}s)</span>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 text-cyan-600" />
                    <span>Kirim Ulang OTP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center max-w-md mx-auto w-full">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dengan memverifikasi, kamu menyetujui{" "}
              <span className="text-cyan-600 font-medium">Syarat Penggunaan</span> dan{" "}
              <span className="text-cyan-600 font-medium">Kebijakan Privasi</span> WorkNest.
            </p>
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
