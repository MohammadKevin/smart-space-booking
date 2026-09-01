import React from "react";
import { ReservationStatus } from "@/lib/api";
import { Clock, CheckCircle2, CheckCheck, XCircle, Activity } from "lucide-react";

interface StatusBadgeProps {
  status: ReservationStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase();

  switch (normalized) {
    case "pending":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        >
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>Menunggu Konfirmasi</span>
        </span>
      );
    case "disetujui":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-sky-600 shrink-0" />
          <span>Disetujui</span>
        </span>
      );
    case "aktif":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
        >
          <Activity className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Sesi Aktif</span>
        </span>
      );
    case "selesai":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <CheckCheck className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Selesai</span>
        </span>
      );
    case "dibatalkan":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 ${className}`}
        >
          <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>Dibatalkan</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <span>{status}</span>
        </span>
      );
  }
}
