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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faEye,
  faEyeSlash,
  faArrowRight,
  faArrowLeft,
  faCircleCheck,
  faCircleExclamation,
  faSpinner,
  faKey,
  faShieldHalved,
  faClock,
  faRotateRight,
  faBuilding,
  faPaste,
} from "@fortawesome/free-solid-svg-icons";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginUser } = useAuth();

  const typeParam = searchParams.get("type") === "reset" ? "reset" : "register";

  const [email] = useState(() => searchParams.get("email") || "");
  const [phone] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("registered_phone") || "";
    }
    return "";
  });
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
    if (!str || !str.includes("@")) return "-";
    const [name, domain] = str.split("@");
    if (name.length <= 3) return `${name}***@${domain}`;
    const visibleStart = name.slice(0, Math.min(8, Math.floor(name.length * 0.7)));
    return `${visibleStart}**@${domain.slice(0, 6)}`;
  };

  const maskPhone = (str: string) => {
    if (!str) return "";
    const clean = str.replace(/\D/g, "");
    if (clean.length < 8) return "";
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

  const applyPastedCode = (pastedText: string) => {
    const digits = pastedText.replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 0) return;

    const newOtp = ["", "", "", "", "", ""];
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);

    const nextFocus = Math.min(digits.length, 5);
    inputRefs.current[nextFocus]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text") || "";
    applyPastedCode(pastedText);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          applyPastedCode(text);
        }
      }
    } catch {
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanDigits = value.replace(/\D/g, "");
    if (cleanDigits.length > 1) {
      applyPastedCode(cleanDigits);
      return;
    }

    const digit = cleanDigits.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullOtp = otp.join("");
    const targetEmail = email.trim();

    if (!targetEmail) {
      setErrorMessage("Alamat email tidak ditemukan. Mengalihkan ke halaman masuk...");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    if (fullOtp.length !== 6) {
      setErrorMessage("Silakan masukkan 6 digit kode keamanan OTP dengan lengkap.");
      return;
    }

    setLoading(true);

    try {
      if (typeParam === "reset") {
        if (!newPassword || newPassword.length < 8) {
          setErrorMessage("Kata sandi baru minimal 8 karakter demi keamanan akun Anda.");
          setLoading(false);
          return;
        }

        const res = await resetPassword({
          email: targetEmail,
          otp: fullOtp,
          password: newPassword,
        });

        setSuccessMessage(res.message || "Kata sandi Anda berhasil diperbarui! Mengalihkan ke halaman masuk...");
        setTimeout(() => router.push("/login"), 1200);
      } else {
        const res = await verifyEmail({
          email: targetEmail,
          otp: fullOtp,
        });

        loginUser(res.access_token, res.user);
        setSuccessMessage("Verifikasi berhasil! Akun Anda telah aktif dan siap digunakan. Mengalihkan ke dashboard...");

        setTimeout(() => {
          const r = res.user.role?.toLowerCase();
          if (r === "admin_space" || r === "owner") {
            router.push("/dashboard/owner");
          } else if (r === "staff") {
            router.push("/dashboard/staff");
          } else if (r === "super_admin") {
            router.push("/dashboard/super-admin");
          } else {
            router.push("/dashboard/member");
          }
        }, 900);
      }
    } catch (err: unknown) {
      const errorText = getApiErrorMessage(err);
      if (errorText.toLowerCase().includes("salah") || errorText.toLowerCase().includes("invalid")) {
        setErrorMessage("Kode OTP yang Anda masukkan tidak sesuai. Pastikan Anda memasukkan 6 digit kode keamanan terbaru dari email Anda.");
      } else if (errorText.toLowerCase().includes("kedaluwarsa") || errorText.toLowerCase().includes("expired")) {
        setErrorMessage("Kode OTP telah kedaluwarsa. Silakan klik tombol 'Kirim Ulang Kode OTP' di bawah untuk mendapatkan kode baru.");
      } else {
        setErrorMessage(errorText);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMessage("Alamat email tidak ditemukan. Silakan kembali ke halaman pendaftaran.");
      return;
    }

    try {
      const res = await resendOtp({
        email: targetEmail,
        type: typeParam === "reset" ? "forgot_password" : "register",
      });

      setSuccessMessage(res.message || "Kode OTP baru telah berhasil dikirimkan ke email Anda. Silakan periksa kotak masuk atau folder spam.");
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
    <div className="fixed inset-0 w-screen h-screen overflow-x-hidden bg-white text-slate-900 z-50 selection:bg-sky-500 selection:text-white">
      <div className="hidden lg:flex w-full h-full relative overflow-hidden bg-white">
        <div className="w-1/2 h-full flex flex-col justify-between p-8 xl:p-12 2xl:p-14 overflow-y-auto bg-white">
          <div className="flex items-center justify-between">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>

            <Link
              href="/"
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
            >
              Beranda
            </Link>
          </div>

          <div className="max-w-md w-full mx-auto my-auto space-y-6">
            <div className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/60 text-sky-700 text-xs font-bold mb-1">
                <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3 text-sky-600" />
                <span>Otentikasi Keamanan Multi-Faktor</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {typeParam === "reset" ? "Reset Kata Sandi Akun" : "Verifikasi Kode OTP"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Masukkan 6 digit kode keamanan OTP yang telah kami kirimkan ke{" "}
                <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md inline-block">
                  {email ? maskEmail(email) : "email Anda"}
                </span>
                {phone && maskPhone(phone) ? (
                  <span className="text-slate-500"> ({maskPhone(phone)})</span>
                ) : null}
                .
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 shadow-xs">
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <p className="font-bold text-rose-900">Verifikasi Belum Berhasil</p>
                  <p className="font-normal text-rose-700 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3 shadow-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <p className="font-bold text-emerald-900">Berhasil</p>
                  <p className="font-normal text-emerald-700 leading-relaxed">{successMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kode Verifikasi 6-Digit
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                    title="Tempel kode OTP dari clipboard"
                  >
                    <FontAwesomeIcon icon={faPaste} className="w-3 h-3" />
                    <span>Tempel Kode</span>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      onFocus={(e) => e.target.select()}
                      className="w-12 h-14 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold font-mono bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-slate-900 focus:outline-none transition-all shadow-sm select-all"
                    />
                  ))}
                </div>
              </div>

              {typeParam === "reset" && (
                <div className="space-y-1.5 text-left pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kata Sandi Baru (Min. 8 Karakter)
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      aria-label="Tampilkan atau sembunyikan kata sandi"
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 text-slate-400" />
                  {resendCooldown > 0 ? (
                    <span>Kirim ulang dalam <span className="font-mono font-bold text-slate-700">{formatTimer(resendCooldown)}</span></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-bold hover:underline cursor-pointer disabled:opacity-60"
                    >
                      <FontAwesomeIcon icon={faRotateRight} className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                      <span>{resending ? "Mengirim..." : "Kirim Ulang Kode OTP"}</span>
                    </button>
                  )}
                </div>

                <Link
                  href="/register"
                  className="font-semibold text-slate-600 hover:text-sky-600 hover:underline"
                >
                  Ganti Alamat Email
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Kode...</span>
                  </>
                ) : (
                  <>
                    <span>{typeParam === "reset" ? "Perbarui Sandi & Masuk" : "Konfirmasi & Aktifkan Akun"}</span>
                    <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500">
              <span>Sudah memiliki akun aktif? </span>
              <Link
                href="/login"
                className="font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
              >
                Masuk di sini
              </Link>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} WorkNest Technologies Inc.
          </div>
        </div>

        <div className="w-1/2 h-full relative p-8 xl:p-12 2xl:p-14 flex flex-col justify-between overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.25)]">
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <img
              src="/login.png"
              alt="WorkNest Security & Smart Verification"
              className="w-full h-full object-cover object-center absolute inset-0 scale-[1.01]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-slate-950/50" />
          </div>

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-12 h-12 flex items-center justify-center text-white shadow-sm shadow-sky-600/30 group-hover:bg-sky-500 transition-colors">
                <img
                  src="/logo-worknest.png"
                  alt="WorkNest Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </Link>
          </div>

          <div className="relative z-10 space-y-5 my-auto max-w-lg text-white">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">
              Proteksi Akun Terenkripsi <br />
              <span className="text-sky-400">dengan Keamanan Multi-Faktor.</span>
            </h2>

            <p className="text-sm text-slate-200 leading-relaxed drop-shadow-sm">
              WorkNest menerapkan standar keamanan tinggi dengan verifikasi kode OTP sekali pakai untuk memastikan hanya Anda yang memiliki kendali penuh atas reservasi dan akses fisik turnstile IoT.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-slate-900/60 border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
                  <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3" />
                </div>
                <span>Enkripsi end-to-end standar TLS 1.3 &amp; otentikasi multi-tenant</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-slate-900/60 border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
                  <FontAwesomeIcon icon={faKey} className="w-3 h-3" />
                </div>
                <span>Aktivasi otomatis smart lock &amp; kunci turnstile setelah verifikasi</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-slate-900/60 border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
                  <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                </div>
                <span>Masa berlaku kode 5 menit dengan proteksi anti brute-force</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-[11px] text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>IDN-JKT-02 &bull; SECURE TOTP ENGINE ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="lg:hidden min-h-screen flex flex-col justify-between p-6 sm:p-8 bg-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faBuilding} className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 text-base">WorkNest</span>
          </Link>

          <Link
            href="/login"
            className="text-xs font-bold text-sky-600 hover:text-sky-700"
          >
            Masuk
          </Link>
        </div>

        <div className="my-auto py-6 space-y-5">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200/60 text-sky-700 text-[11px] font-bold mb-1">
              <FontAwesomeIcon icon={faShieldHalved} className="w-2.5 h-2.5 text-sky-600" />
              <span>Verifikasi Keamanan OTP</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {typeParam === "reset" ? "Reset Kata Sandi" : "Verifikasi OTP"}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Masukkan 6 digit kode OTP yang telah dikirimkan ke{" "}
              <span className="font-semibold text-slate-800">{email ? maskEmail(email) : "email Anda"}</span>.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-rose-900">Verifikasi Belum Berhasil</p>
                <p className="font-normal text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-emerald-900">Berhasil</p>
                <p className="font-normal text-emerald-700 leading-relaxed">{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Kode 6-Digit</label>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                >
                  <FontAwesomeIcon icon={faPaste} className="w-2.5 h-2.5" />
                  <span>Tempel Kode</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-slate-900 focus:outline-none shadow-sm select-all"
                  />
                ))}
              </div>
            </div>

            {typeParam === "reset" && (
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-slate-700">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 karakter"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              {resendCooldown > 0 ? (
                <span>Kirim ulang ({formatTimer(resendCooldown)})</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sky-600 font-bold hover:underline"
                >
                  {resending ? "Mengirim..." : "Kirim Ulang OTP"}
                </button>
              )}

              <Link href="/register" className="text-slate-600 hover:underline">
                Ganti email
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>{typeParam === "reset" ? "Simpan Sandi Baru" : "Konfirmasi & Lanjutkan"}</span>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          &copy; {new Date().getFullYear()} WorkNest Technologies Inc.
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-xs text-slate-500">
          Memuat verifikasi OTP...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
