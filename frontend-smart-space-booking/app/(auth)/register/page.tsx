"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  registerMember,
  registerOwner,
  RegisterMemberDto,
  RegisterOwnerDto,
  getApiErrorMessage,
} from "@/lib/api";
import { WorkNestLogo } from "@/components/WorkNestLogo";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import {
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Building2,
  MapPin,
  Shield,
} from "lucide-react";

type RegisterRole = "member" | "owner";

function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<RegisterRole>("member");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const [namaCoworking, setNamaCoworking] = useState("");
  const [alamat, setAlamat] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!agreedToTerms) {
      setErrorMessage("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Work email cannot be empty.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    let cleanPhone = phone.trim().replace(/^0/, "");
    if (!cleanPhone.startsWith("+62") && !cleanPhone.startsWith("62")) {
      cleanPhone = "08" + cleanPhone.replace(/^8/, "");
    }

    setLoading(true);

    try {
      if (role === "member") {
        if (!fullName.trim()) {
          setErrorMessage("Please enter your full name.");
          setLoading(false);
          return;
        }

        const dto: RegisterMemberDto = {
          email: email.trim(),
          password,
          namaMember: fullName.trim(),
          instansi: "WorkNest Member",
          alamat: "Indonesia",
          telp: cleanPhone.startsWith("0") ? cleanPhone : "0" + cleanPhone.replace(/^(\+62|62)/, ""),
        };

        const res = await registerMember(dto);
        setSuccessMessage(
          res.message || "Account created successfully! Redirecting to security verification..."
        );
      } else {
        if (!namaCoworking.trim()) {
          setErrorMessage("Please enter your Coworking space / property name.");
          setLoading(false);
          return;
        }
        if (!fullName.trim()) {
          setErrorMessage("Please enter the owner or manager name.");
          setLoading(false);
          return;
        }
        if (!alamat.trim()) {
          setErrorMessage("Please enter the commercial property address.");
          setLoading(false);
          return;
        }

        const dto: RegisterOwnerDto = {
          email: email.trim(),
          password,
          namaCoworking: namaCoworking.trim(),
          namaPemilik: fullName.trim(),
          telp: cleanPhone.startsWith("0") ? cleanPhone : "0" + cleanPhone.replace(/^(\+62|62)/, ""),
          alamat: alamat.trim(),
        };

        const res = await registerOwner(dto);
        setSuccessMessage(
          res.message || "Host account registered! Redirecting to email verification..."
        );
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("registered_phone", cleanPhone);
      }

      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}&type=register`);
      }, 750);
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 sm:px-6 bg-[#F4F7FA] text-slate-900 relative selection:bg-[#006370] selection:text-white">
      
      <Link
        href="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-10 text-sm text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5"
      >
        <span>&larr;</span>
        <span>Kembali</span>
      </Link>

      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-7 sm:p-9 transition-all">
        
        <div className="flex flex-col items-center text-center">
          <WorkNestLogo size="md" />

          <h1 className="text-2xl sm:text-[25px] font-extrabold text-slate-900 tracking-tight mt-5">
            Buatlah akun WorkNest 
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 max-w-sm leading-relaxed">
            Pesan ruangan sesuai kebutuhan Anda atau daftarkan properti Anda di seluruh Indonesia.
          </p>
        </div>

        <div className="mt-6 bg-[#F1F5F9] p-1 rounded-[10px] grid grid-cols-2 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setRole("member");
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === "member"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                role === "member" ? "bg-[#006370]" : "bg-transparent"
              }`}
            />
            <span>Member</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("owner");
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === "owner"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                role === "owner" ? "bg-[#006370]" : "bg-transparent"
              }`}
            />
            <span>Owner</span>
          </button>
        </div>

        <div className="pt-2" />

        {errorMessage && (
          <div className="mb-4 p-3 rounded-[10px] bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
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
              {role === "owner" ? "Full Name / PIC Name" : "Full Name"}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Bambang Wicaksono"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#006370] focus:ring-2 focus:ring-[#006370]/15 rounded-[10px] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.co.id"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#006370] focus:ring-2 focus:ring-[#006370]/15 rounded-[10px] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-800">
                WhatsApp / Phone Number
              </label>
            </div>
            <div className="flex items-stretch border border-slate-200 rounded-[10px] bg-white overflow-hidden focus-within:border-[#006370] focus-within:ring-2 focus-within:ring-[#006370]/15 transition-all">
              <span className="bg-slate-50 text-slate-700 font-mono text-xs font-semibold px-3.5 py-2.5 border-r border-slate-200 select-none shrink-0 flex items-center">
                +62
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="812-3456-7890"
                className="w-full px-3.5 py-2.5 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono"
              />
            </div>
          </div>

          {role === "owner" && (
            <div className="space-y-3.5 p-3.5 bg-slate-50 rounded-[10px] border border-slate-200/90 text-xs">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Coworking Space / Commercial Brand Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={namaCoworking}
                    onChange={(e) => setNamaCoworking(e.target.value)}
                    placeholder="e.g. Malang Creative Hub"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#006370] rounded-[10px] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Property Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Jl. Ijen No. 88, Oro-oro Dowo, Malang"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#006370] rounded-[10px] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a robust passphrase"
                className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 focus:border-[#006370] focus:ring-2 focus:ring-[#006370]/15 rounded-[10px] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer rounded"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 pt-0.5 px-0.5">
              <span>Min. 8 characters</span>
              <span>Work-Nest-Security</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#006370] focus:ring-[#006370] cursor-pointer"
            />
            <label
              htmlFor="terms"
              className="text-xs text-slate-600 leading-snug cursor-pointer select-none"
            >
              Saya menyetujui{" "}
              <Link
                href="/terms"
                className="text-[#006370] font-semibold hover:underline"
              >
                Syarat & Ketentuan
              </Link>{" "}
              dan{" "}
              <Link
                href="/privacy"
                className="text-[#006370] font-semibold hover:underline"
              >
                Kebijakan Privasi
              </Link>
              .
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400 font-medium">atau daftar dengan</span>
          </div>
        </div>

        <GoogleLoginButton
          label="Daftar Akun dengan Google"
          onError={(err) => setErrorMessage(err)}
        />

        <div className="mt-6 text-center text-xs text-slate-500">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-bold text-[#006370] hover:text-[#004f59] hover:underline"
          >
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7FA]">
          <Loader2 className="w-8 h-8 text-[#006370] animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}