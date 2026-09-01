import React from "react";
import Link from "next/link";
import { Space } from "@/lib/api";
import { Users, ArrowRight, Building, Sparkles } from "lucide-react";

interface SpaceCardProps {
  space: Space;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SpaceCard({ space }: SpaceCardProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "desk":
        return {
          label: "Hot Desk",
          className: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "meeting_room":
        return {
          label: "Meeting Room",
          className: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "private_office":
        return {
          label: "Private Office",
          className: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      default:
        return {
          label: type,
          className: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  const badge = getTypeBadge(space.tipe);
  const fallbackImage =
    space.tipe === "meeting_room"
      ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
      : space.tipe === "private_office"
      ? "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80"
      : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col">
      {/* Space Photo */}
      <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={space.foto || fallbackImage}
          alt={space.namaSpace}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md bg-white/90 ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-white">
            <Users className="w-3.5 h-3.5" />
            <span>Kapasitas {space.kapasitas} orang</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {space.owner?.namaCoworking && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Building className="w-3.5 h-3.5 text-sky-500" />
              <span className="truncate">{space.owner.namaCoworking}</span>
            </div>
          )}

          <h3 className="font-bold text-slate-900 text-lg group-hover:text-sky-600 transition-colors line-clamp-1">
            {space.namaSpace}
          </h3>

          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {space.deskripsi || "Ruangan kerja representatif dengan fasilitas lengkap dan kenyamanan maksimal."}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tarif Sewa
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-slate-900">
                {formatRupiah(space.hargaPerJam)}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ jam</span>
            </div>
          </div>

          <Link
            href={`/booking/${space.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white font-semibold text-xs transition-all shadow-sm group-hover:shadow group-hover:bg-sky-600 group-hover:text-white"
          >
            <span>Pesan</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
