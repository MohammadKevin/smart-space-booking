"use client";

import React from "react";
import Link from "next/link";
import { Space } from "@/lib/api";
import { MapPin } from "lucide-react";

interface SpaceCardProps {
  space: Space;
  priority?: boolean;
}

import { formatRupiah } from "@/lib/utils";
export { formatRupiah };

export function SpaceCard({ space }: SpaceCardProps) {
  const fallbackImage =
    space.tipe === "meeting_room"
      ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
      : space.tipe === "private_office"
      ? "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
      : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80";

  const getTypePaxLabel = () => {
    if (space.tipe === "desk") return `Flex Desk • ${space.kapasitas} Orang`;
    if (space.tipe === "meeting_room") return `Ruang Rapat • ${space.kapasitas} Orang`;
    return `Suite Privat • ${space.kapasitas} Orang`;
  };

  const locationText = space.owner?.alamat || space.owner?.namaCoworking || "Klojen, Malang";

  return (
    <div className="bg-white rounded-xs border border-slate-200/90 overflow-hidden flex flex-col justify-between hover:border-slate-300 shadow-2xs hover:shadow-md transition-all group">
      <div>
        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
          <img
            src={space.foto || fallbackImage}
            alt={space.namaSpace}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />

          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-white border border-white/10 shadow-xs">
              {getTypePaxLabel()}
            </span>
          </div>

          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-white/95 backdrop-blur-md text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Tersedia</span>
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/spaces/${space.id}`} className="group-hover:text-[#006370] transition-colors">
              <h3 className="font-serif text-base font-bold text-slate-900 leading-snug">
                {space.namaSpace}
              </h3>
            </Link>
            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-xs text-slate-600 shrink-0 font-medium border border-slate-200">
              ID #SP-{String(space.id).padStart(2, "0")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>

          {space.deskripsi && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
              {space.deskripsi}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-slate-600 font-medium">
            <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 border border-slate-200">
              Wi-Fi Fiber
            </span>
            <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 border border-slate-200">
              {space.tipe === "meeting_room" ? "Layar 4K" : "Kursi Ergonomis"}
            </span>
            <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 border border-slate-200">
              Kunci Digital QR
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 pt-2.5 border-t border-slate-100 flex items-center justify-between bg-white">
        <div>
          <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider font-mono">
            Tarif Sewa
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-900 font-mono">
              {formatRupiah(space.hargaPerJam)}
            </span>
            <span className="text-[11px] text-slate-500">/ jam</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/spaces/${space.id}`}
            className="px-3 py-1.5 rounded-xs border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            Detail
          </Link>
          <Link
            href={`/booking/${space.id}`}
            className="px-3.5 py-1.5 rounded-xs bg-[#006370] hover:bg-[#004f59] text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            Pesan
          </Link>
        </div>
      </div>
    </div>
  );
}
