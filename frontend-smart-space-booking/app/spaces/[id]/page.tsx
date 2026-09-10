"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  MapPin,
  Star,
  Users,
  Wifi,
  Calendar,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building,
  Clock,
  Check,
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

  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedHours, setSelectedHours] = useState<string[]>(["14:00", "15:00", "16:00"]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [spaceData, reviewsData, ratingData] = await Promise.all([
          getSpaceDetail(spaceId),
          getSpaceReviews(spaceId).catch(() => []),
          getSpaceRatingSummary(spaceId).catch(() => null),
        ]);

        setSpace(spaceData);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        setRatingSummary(ratingData);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err) || "Gagal memuat detail ruangan.");
      } finally {
        setLoading(false);
      }
    }

    if (spaceId) {
      loadData();
    }
  }, [spaceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#006370] mb-2" />
        <p className="text-xs font-medium text-slate-600">Memuat data ruangan...</p>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xs border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-slate-900">Ruangan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{error || "Data ruangan tidak tersedia atau telah dihapus."}</p>
          <div className="pt-2">
            <Link
              href="/spaces"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-semibold rounded-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Katalog Ruangan</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fallbackImage =
    space.tipe === "meeting_room"
      ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
      : space.tipe === "private_office"
      ? "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
      : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80";

  const averageRating = ratingSummary?.averageRating || 5.0;
  const totalReviewsCount = ratingSummary?.totalReviews || reviews.length || 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
              <span>DETAIL RUANG KERJA</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-sans font-normal">
                {space.owner?.namaCoworking || "WorkNest Hub"}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {space.namaSpace}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              {space.owner?.alamat || "Lokasi venue resmi mitra WorkNest"}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              href="/spaces"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Katalog</span>
            </Link>
            <Link
              href={`/booking/${space.id}`}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-bold rounded-xs shadow-2xs transition-all cursor-pointer"
            >
              <span>Pesan Ruangan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xs border border-slate-200 overflow-hidden shadow-2xs">
              <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden">
                <img
                  src={space.foto || fallbackImage}
                  alt={space.namaSpace}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackImage;
                  }}
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white font-mono text-[10px] px-2.5 py-1 rounded-xs font-bold uppercase">
                  {space.tipe?.replace(/_/g, " ")}
                </span>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h2 className="font-serif text-lg font-bold text-slate-900">
                    Deskripsi &amp; Spesifikasi
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2 whitespace-pre-line">
                    {space.deskripsi || "Ruangan berstandar modern dengan perlengkapan lengkap, akses kartu kunci digital, dan internet cepat."}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xs border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Kapasitas</span>
                    <strong className="text-slate-900">{space.kapasitas} Orang</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xs border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Tarif Sewa</span>
                    <strong className="text-[#006370] font-mono">{formatRupiah(space.hargaPerJam)} / jam</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xs border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Tipe Ruangan</span>
                    <strong className="text-slate-900 uppercase font-mono">{space.tipe?.replace(/_/g, " ")}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xs border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    Ulasan Member ({totalReviewsCount})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Penilaian dari tamu yang pernah menggunakan ruangan ini
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-mono font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{averageRating.toFixed(1)}</span>
                </div>
              </div>

              <div className="space-y-3">
                {reviews.length > 0 ? (
                  reviews.map((r) => (
                    <div key={r.id} className="p-3.5 bg-slate-50 rounded-xs border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{r.reservasi?.member?.namaMember || "Member"}</span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: r.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {r.komentar || "Fasilitas sangat memuaskan dan koneksi internet stabil."}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Belum ada ulasan untuk ruangan ini.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            <div className="bg-white rounded-xs border border-slate-200 p-5 space-y-4 shadow-2xs">
              <h3 className="font-serif text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Pesan Ruangan Ini
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Tarif Sewa</span>
                  <div className="text-2xl font-bold text-[#006370] font-mono">
                    {formatRupiah(space.hargaPerJam)} <span className="text-xs font-normal text-slate-500 font-sans">/ jam</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Konfirmasi instan dengan QR Code pass</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sudah termasuk fasilitas Wi-Fi &amp; listrik</span>
                  </div>
                </div>

                <Link
                  href={`/booking/${space.id}`}
                  className="w-full py-2.5 px-4 rounded-xs bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  <span>Mulai Reservasi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
