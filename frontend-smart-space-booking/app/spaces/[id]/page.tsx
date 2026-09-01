"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getSpaceDetail,
  Space,
  getApiErrorMessage,
} from "@/lib/api";
import { formatRupiah } from "@/components/SpaceCard";
import {
  Building,
  Users,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Wifi,
  MonitorCheck,
  Armchair,
  Coffee,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface SpaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SpaceDetailPage({ params }: SpaceDetailPageProps) {
  const resolvedParams = use(params);
  const spaceId = parseInt(resolvedParams.id, 10);
  const router = useRouter();

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSpaceDetail(spaceId);
        setSpace(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    if (spaceId) {
      loadDetail();
    }
  }, [spaceId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-xs font-semibold">Memuat rincian ruangan...</p>
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Ruangan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">{error || "Ruangan ini tidak tersedia atau telah dihapus."}</p>
        <Link
          href="/spaces"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-xl hover:bg-sky-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>
    );
  }

  const fallbackImage =
    space.tipe === "meeting_room"
      ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
      : space.tipe === "private_office"
      ? "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
      : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80";

  const getTypeLabel = (type: string) => {
    if (type === "desk") return "Hot Desk / Workstation";
    if (type === "meeting_room") return "Meeting Room";
    return "Private Office";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/spaces"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Katalog Ruangan</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image & Highlights */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Photo Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="relative aspect-[16/9] bg-slate-100 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={space.foto || fallbackImage}
                alt={space.namaSpace}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-sky-700 border border-sky-200 shadow-sm">
                  {getTypeLabel(space.tipe)}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                {space.owner?.namaCoworking && (
                  <p className="text-xs font-bold text-sky-600 flex items-center gap-1.5">
                    <Building className="w-4 h-4" />
                    <span>{space.owner.namaCoworking}</span>
                  </p>
                )}
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {space.namaSpace}
                </h1>
                {space.owner?.alamat && (
                  <p className="text-xs text-slate-500">{space.owner.alamat}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deskripsi & Fasilitas Ruangan
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {space.deskripsi || "Ruangan kerja berstandar profesional yang dirancang untuk mendukung produktivitas optimal Anda. Dilengkapi pencahayaan yang nyaman, konektivitas internet prima, serta kursi ergonomis."}
                </p>
              </div>

              {/* Amenities Grid */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fasilitas Termasuk
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
                    <Wifi className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold">High-Speed WiFi</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
                    <Armchair className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold">Kursi Ergonomis</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
                    <Coffee className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold">Free Flow Coffee</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold">Akses QR Terintegrasi</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
                    <MonitorCheck className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold">Port Daya Dedicated</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold">AC & Pencahayaan Sehat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Booking Action Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 sticky top-24">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tarif Pemakaian
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">
                  {formatRupiah(space.hargaPerJam)}
                </span>
                <span className="text-xs text-slate-500 font-semibold">/ jam</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Kapasitas Maksimal:</span>
                <span className="font-bold text-slate-900">{space.kapasitas} Orang</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tipe Ruangan:</span>
                <span className="font-bold text-slate-900">{getTypeLabel(space.tipe)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Metode Check-In:</span>
                <span className="font-bold text-sky-600">Tiket QR Code Mandiri</span>
              </div>
            </div>

            <Link
              href={`/booking/${space.id}`}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-xs text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Lanjut ke Formulir Reservasi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-[11px] text-sky-800 text-center">
              Dapat dibatalkan gratis hingga 1 jam sebelum jam mulai pemesanan.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
