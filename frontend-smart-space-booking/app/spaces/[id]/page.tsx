"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  getSpaceDetail,
  getSpaceReviews,
  getSpaceRatingSummary,
  Space,
  Review,
  RatingSummary,
  getApiErrorMessage,
} from "@/lib/api";
import { formatRupiah } from "@/components/SpaceCard";
import {
  Building2,
  Users,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Wifi,
  MonitorCheck,
  Armchair,
  Coffee,
  CheckCircle2,
  MapPin,
  Star,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";

interface SpaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SpaceDetailPage({ params }: SpaceDetailPageProps) {
  const resolvedParams = use(params);
  const spaceId = parseInt(resolvedParams.id, 10);

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [spaceData, reviewsRes, summaryRes] = await Promise.all([
          getSpaceDetail(spaceId),
          getSpaceReviews(spaceId, 1, 10).catch(() => ({ data: [] } as any)),
          getSpaceRatingSummary(spaceId).catch(() => null),
        ]);
        setSpace(spaceData);
        setReviews(reviewsRes?.data || []);
        setRatingSummary(summaryRes);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
        setLoadingReviews(false);
      }
    }
    if (spaceId) {
      loadData();
    }
  }, [spaceId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
          <p className="text-xs font-semibold">Memuat rincian ruangan...</p>
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Ruangan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">{error || "Ruangan ini tidak tersedia atau telah dihapus."}</p>
        <Link
          href="/spaces"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 transition-colors"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href="/spaces"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Katalog Ruangan</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="relative aspect-[16/9] bg-slate-100 w-full border-b border-slate-200">
              <img
                src={space.foto || fallbackImage}
                alt={space.namaSpace}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 backdrop-blur-xs text-sky-800 border border-sky-200">
                  {getTypeLabel(space.tipe)}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                {space.owner?.namaCoworking && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{space.owner.namaCoworking}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {space.namaSpace}
                  </h1>
                  {ratingSummary && ratingSummary.totalReviews > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{ratingSummary.averageRating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">
                        ({ratingSummary.totalReviews} ulasan)
                      </span>
                    </div>
                  )}
                </div>
                {space.owner?.alamat && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{space.owner.alamat}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deskripsi Ruangan
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {space.deskripsi ||
                    "Ruangan kerja berstandar profesional yang dirancang untuk mendukung produktivitas optimal. Dilengkapi pencahayaan yang nyaman, konektivitas internet prima, serta kursi ergonomis."}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fasilitas Termasuk
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-700">
                    <Wifi className="w-3.5 h-3.5 text-sky-600" />
                    <span>High-Speed WiFi</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-700">
                    <Armchair className="w-3.5 h-3.5 text-sky-600" />
                    <span>Kursi Ergonomis</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-700">
                    <Coffee className="w-3.5 h-3.5 text-sky-600" />
                    <span>Free Flow Coffee</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Akses Tiket QR Mandiri</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-700">
                    <MonitorCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Port Daya Dedicated</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>AC & Ruang Tenang</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating & Reviews Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h2 className="text-base font-bold text-slate-900">
                    Rating & Ulasan Pengunjung
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Ulasan terverifikasi dari member yang telah menyelesaikan sesi di ruangan ini.
                </p>
              </div>

              {ratingSummary && ratingSummary.totalReviews > 0 ? (
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-900">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-sm">
                      {ratingSummary.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-amber-700 font-medium">
                    ({ratingSummary.totalReviews} ulasan)
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                  Belum ada rating
                </span>
              )}
            </div>

            {loadingReviews ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-sky-600" />
                <p className="text-xs mt-2 font-medium">Memuat ulasan ruangan...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4 divide-y divide-slate-100">
                {reviews.map((rev) => {
                  const reviewerName =
                    rev.reservasi?.member?.namaMember || "Pengunjung WorkNest";
                  const revDate = rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "";

                  return (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 font-bold text-xs flex items-center justify-center border border-cyan-200">
                            {reviewerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {reviewerName}
                            </p>
                            <p className="text-[10px] text-slate-400">{revDate}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.komentar && (
                        <p className="text-xs text-slate-700 leading-relaxed pl-10 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/80">
                          &ldquo;{rev.komentar}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <MessageSquareQuote className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  Belum ada ulasan untuk ruangan ini
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Jadilah pengunjung pertama yang memesan dan memberikan pengalaman menarik Anda setelah sesi selesai.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 sticky top-20">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tarif Pemakaian
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {formatRupiah(space.hargaPerJam)}
                </span>
                <span className="text-xs text-slate-500 font-normal">/ jam</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Kapasitas Maksimal:</span>
                <span className="font-semibold text-slate-900">{space.kapasitas} Orang</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tipe Ruangan:</span>
                <span className="font-semibold text-slate-900">{getTypeLabel(space.tipe)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Akses Masuk:</span>
                <span className="font-semibold text-sky-700">Validasi Kode QR</span>
              </div>
            </div>

            <Link
              href={`/booking/${space.id}`}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Lanjut ke Formulir Reservasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100 text-[11px] text-slate-600 text-center">
              Pemesanan instan terhubung langsung ke database live.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
