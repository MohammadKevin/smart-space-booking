import React from "react";
import { PaymentStatus } from "@/lib/api";
import { CreditCard, Clock4, BadgeCheck, XCircle, RotateCcw } from "lucide-react";

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string;
  className?: string;
}

export function PaymentStatusBadge({ status, className = "" }: PaymentStatusBadgeProps) {
  const normalized = (status || "").toLowerCase();

  switch (normalized) {
    case "belum_bayar":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        >
          <CreditCard className="w-3 h-3 shrink-0" />
          <span>Belum Bayar</span>
        </span>
      );
    case "menunggu_pembayaran":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        >
          <Clock4 className="w-3 h-3 text-amber-600 shrink-0" />
          <span>Menunggu Pembayaran</span>
        </span>
      );
    case "lunas":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
        >
          <BadgeCheck className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Lunas</span>
        </span>
      );
    case "gagal":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 ${className}`}
        >
          <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>Gagal</span>
        </span>
      );
    case "refund":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 ${className}`}
        >
          <RotateCcw className="w-3 h-3 text-indigo-600 shrink-0" />
          <span>Refund</span>
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