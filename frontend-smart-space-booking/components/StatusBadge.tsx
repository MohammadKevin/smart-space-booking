import React from "react";
import { ReservationStatus } from "@/lib/api";
import { Clock, CheckCircle2, Zap, CheckCheck, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: ReservationStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case "pending":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          Menunggu Konfirmasi
        </span>
      );
    case "disetujui":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
          Disetujui
        </span>
      );
    case "aktif":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 animate-pulse" />
          Sesi Aktif
        </span>
      );
    case "selesai":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
          Selesai
        </span>
      );
    case "dibatalkan":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          Dibatalkan
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        >
          {status}
        </span>
      );
  }
}
