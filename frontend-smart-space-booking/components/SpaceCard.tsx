import React from "react";
import Link from "next/link";
import { Space } from "@/lib/api";
import { Users, ArrowRight, Building2 } from "lucide-react";

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
          className: "bg-blue-50 text-blue-800 border-blue-200",
        };
      case "meeting_room":
        return {
          label: "Meeting Room",
          className: "bg-sky-50 text-sky-800 border-sky-200",
        };
      case "private_office":
        return {
          label: "Private Office",
          className: "bg-indigo-50 text-indigo-800 border-indigo-200",
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors">
      {/* Space Photo & Overlay Badges */}
      <div>
        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden border-b border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={space.foto || fallbackImage}
            alt={space.namaSpace}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />

          <div className="absolute top-2.5 left-2.5">
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-white/95 backdrop-blur-xs ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900/80 backdrop-blur-xs text-white">
              <Users className="w-3 h-3" />
              <span>{space.kapasitas} Orang</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2">
          {space.owner?.namaCoworking && (
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{space.owner.namaCoworking}</span>
            </div>
          )}

          <h3 className="font-semibold text-slate-900 text-base leading-snug">
            {space.namaSpace}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {space.deskripsi || "Workstation representatif dengan fasilitas lengkap dan konektivitas prima."}
          </p>
        </div>
      </div>

      {/* Pricing Footer & CTA */}
      <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Tarif Sewa
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-900 font-mono">
              {formatRupiah(space.hargaPerJam)}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">/jam</span>
          </div>
        </div>

        <Link
          href={`/booking/${space.id}`}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors"
        >
          <span>Pesan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
