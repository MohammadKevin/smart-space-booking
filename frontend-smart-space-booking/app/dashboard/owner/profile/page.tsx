"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile, getApiErrorMessage } from "@/lib/api";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Building,
  ShieldCheck,
  Save,
  Info,
  Shield,
  Activity,
  Server,
} from "lucide-react";

export default function OwnerProfilePage() {
  const { user, refreshUser } = useAuth();

  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bankName, setBankName] = useState("Bank Central Asia (BCA)");
  const [accountNumber, setAccountNumber] = useState("038-883-9912");
  const [accountHolder, setAccountHolder] = useState("");

  const [activeTab, setActiveTab] = useState<"general" | "hours" | "payout">("general");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.spaceOwner?.namaCoworking) setVenueName(user.spaceOwner.namaCoworking);
      if (user.spaceOwner?.alamat) setAddress(user.spaceOwner.alamat);
      if (user.spaceOwner?.telp) setPhone(user.spaceOwner.telp);
      if (user.email) setEmail(user.email);
      if (user.spaceOwner?.namaCoworking) setAccountHolder(user.spaceOwner.namaCoworking);
    }
  }, [user]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateProfile({
        namaCoworking: venueName.trim(),
        alamat: address.trim(),
        telp: phone.trim(),
      });
      await refreshUser();
      setSuccessMsg("Profil venue coworking dan kontak operasional berhasil disimpan.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>WORKSPACE OWNER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Profil Venue &amp; Pengaturan Rekening
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Profil &amp; Operasional Venue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola identitas publik coworking space Anda, alamat operasional, kontak layanan, serta rincian rekening pencairan hasil reservasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refreshUser()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-semibold rounded-xs shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Profil</span>
              </>
            )}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xs text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-semibold text-slate-500">
        {[
          { id: "general", label: "Informasi Venue & Kontak", icon: Building2 },
          { id: "hours", label: "Jam Operasional", icon: Clock },
          { id: "payout", label: "Rekening Pencairan", icon: CreditCard },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? "border-[#006370] text-[#006370] font-bold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === "general" && (
            <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-serif text-base font-bold text-slate-900">
                  Informasi Publik Coworking Space
                </h2>
                <p className="text-xs text-slate-500">
                  Data ini ditampilkan di katalog ruang kerja, halaman checkout, dan tiket reservasi member.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Coworking Space / Venue
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Contoh: WorkNest Creative Hub Malang"
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xs outline-none focus:border-[#006370] text-slate-900 font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat Lengkap Venue
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Jl. Raya No. ..., Kota, Provinsi"
                      className="w-full pl-9 pr-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xs outline-none focus:border-[#006370] text-slate-900 font-medium transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email Akun Owner
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full pl-9 pr-3.5 py-2 border border-slate-200 bg-slate-100 rounded-xs text-slate-600 cursor-not-allowed font-medium font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Email terdaftar dan terautentikasi oleh sistem
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Telepon / WhatsApp Operasional
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full pl-9 pr-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xs outline-none focus:border-[#006370] text-slate-900 font-medium transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "hours" && (
            <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-serif text-base font-bold text-slate-900">
                  Jam Buka &amp; Ketentuan Reservasi
                </h2>
                <p className="text-xs text-slate-500">
                  Ketentuan jadwal operasional venue untuk pemesanan slot ruangan oleh member.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-mono font-bold uppercase text-slate-400 bg-slate-50/80">
                      <th className="py-2.5 px-3">HARI</th>
                      <th className="py-2.5 px-3">JAM BUKA</th>
                      <th className="py-2.5 px-3">JAM TUTUP</th>
                      <th className="py-2.5 px-3 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {["Senin - Jumat", "Sabtu", "Minggu"].map((day, idx) => (
                      <tr key={day} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-semibold text-slate-900">{day}</td>
                        <td className="py-3 px-3 font-mono">08:00 WIB</td>
                        <td className="py-3 px-3 font-mono">{idx === 2 ? "20:00 WIB" : "22:00 WIB"}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Buka
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xs bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#006370] shrink-0 mt-0.5" />
                <span>
                  Member hanya dapat memilih slot jam reservasi di antara jam buka dan tutup yang berlaku pada venue Anda.
                </span>
              </div>
            </div>
          )}

          {activeTab === "payout" && (
            <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-serif text-base font-bold text-slate-900">
                  Rekening Bank Penerima Dana
                </h2>
                <p className="text-xs text-slate-500">
                  Rekening tujuan transfer berkala atas bagi hasil reservasi yang lunas dari platform WorkNest.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Bank
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xs outline-none focus:border-[#006370] text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xs outline-none focus:border-[#006370] text-slate-900 font-mono font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Pemilik Rekening (Sesuai Buku Tabungan)
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xs outline-none focus:border-[#006370] text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xs bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Hasil transaksi reservasi secara otomatis dialokasikan ke saldo bersih owner setelah potongan komisi resmi super admin.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xs p-5 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-11 h-11 rounded-xs bg-[#E6F4F2] border border-[#BCE3DE] text-[#006370] flex items-center justify-center font-bold text-base font-mono shrink-0">
                {(venueName || "WN").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate">
                  {venueName || "WorkNest Hub"}
                </h3>
                <p className="text-xs text-slate-500 font-mono truncate">
                  {email || "owner@worknest.id"}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status Kemitraan</span>
                <span className="px-2 py-0.5 bg-[#E6F4F2] text-[#006370] border border-[#BCE3DE] rounded-xs font-bold text-[10px] font-mono uppercase">
                  Mitra Resmi
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Verifikasi Lokasi</span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Terverifikasi</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-mono mb-0.5">Alamat Operasional</span>
                <span className="text-slate-700 font-medium block">{address || "Belum diisi"}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-mono mb-0.5">Kontak WhatsApp</span>
                <span className="text-slate-700 font-mono font-medium block">{phone || "-"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xs p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-serif">
              <ShieldCheck className="w-4 h-4 text-[#006370]" />
              <span>Keamanan Kemitraan Platform</span>
            </div>
            <div className="space-y-2 text-[11px] text-slate-500">
              <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-xs border border-slate-100">
                <Server className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>Penyaluran payout terlindungi rekonsiliasi otomatis Midtrans.</span>
              </div>
              <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-xs border border-slate-100">
                <Activity className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>Monitoring reservasi dan QR check-in 24/7 real-time.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
