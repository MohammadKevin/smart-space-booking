"use client";

import React from "react";
import Link from "next/link";
import { Space } from "@/lib/api";
import { MapPin, Star, Users, ArrowRight } from "lucide-react";

interface SpaceCardProps {
  space: Space;
  priority?: boolean;
}

export function formatRupiah(amount: number | string | undefined | null): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || 0)) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

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
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-lg transition-all group">
      <div>
        {/* Photo Container */}
        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
          <img
            src={space.foto || fallbackImage}
            alt={space.namaSpace}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />

          {/* Type & Pax Badge (Top-Left) */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-xs">
              {getTypePaxLabel()}
            </span>
          </div>

          {/* Availability Status Badge (Top-Right) */}
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-md text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Tersedia Hari Ini</span>
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-[17px] font-bold text-slate-900 leading-snug group-hover:text-cyan-900 transition-colors">
              {space.namaSpace}
            </h3>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 shrink-0 mt-0.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>4.96</span>
              <span className="text-slate-400 font-normal">({space.id * 17 + 28})</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>

          {/* Amenities Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-600 font-medium">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Wi-Fi Fiber Cepat
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {space.tipe === "meeting_room" ? "Presentasi 4K" : "Kursi Ergonomis"}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Area Kopi
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Kedap Suara
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Price & Book Button */}
      <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-white">
        <div>
          <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wide">
            Tarif Sewa
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-900 font-mono">
              {formatRupiah(space.hargaPerJam)}
            </span>
            <span className="text-xs text-slate-500">/ jam</span>
          </div>
        </div>

        <Link
          href={`/booking/${space.id}`}
          className="px-4 py-2 rounded-lg bg-[#0D5C63] hover:bg-[#094348] text-white text-xs font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer"
        >
          Pesan Sekarang
        </Link>
      </div>
    </div>
  );
}
