"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  User,
  Building,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Ticket,
  Clock,
} from "lucide-react";

export default function MemberProfilePage() {
  const { user } = useAuth();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const member = user?.member;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
          <User className="w-3.5 h-3.5 text-cyan-600" />
          <span>Profil Pengguna</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Identitas & Informasi Member
        </h1>
        <p className="text-xs text-slate-500">
          Informasi profil yang digunakan untuk validasi akses check-in dan kontak coworking space.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-cyan-600 via-sky-600 to-slate-900 p-6 relative flex items-end justify-end">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Member Terverifikasi</span>
          </span>
        </div>

        {/* Profile Details */}
        <div className="p-6 pt-0 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-md border border-slate-200 shrink-0">
                <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-2xl overflow-hidden">
                  {member?.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.foto} alt={member.namaMember} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <h2 className="text-xl font-bold text-slate-900">
                  {member?.namaMember || user?.username}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {member?.instansi || "Komunitas / Profesional Mandiri"}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-600" />
                <span>Nama Lengkap</span>
              </span>
              <p className="text-sm font-bold text-slate-900">
                {member?.namaMember || user?.username}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-600" />
                <span>Instansi / Perusahaan / Kampus</span>
              </span>
              <p className="text-sm font-bold text-slate-900">
                {member?.instansi || "-"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-600" />
                <span>Nomor WhatsApp / Telepon</span>
              </span>
              <p className="text-sm font-bold text-slate-900 font-mono">
                {member?.telp || "-"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>Alamat Domisili</span>
              </span>
              <p className="text-sm font-bold text-slate-900">
                {member?.alamat || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
