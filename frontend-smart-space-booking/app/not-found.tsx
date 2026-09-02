import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-5">
        <div className="space-y-1">
          <p className="text-6xl font-extrabold text-cyan-600 tracking-tight">404</p>
          <h1 className="text-xl font-bold text-slate-900">Halaman Tidak Ditemukan</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Halaman yang Anda cari tidak tersedia atau sudah dipindahkan. Silakan kembali ke beranda atau gunakan navigasi di bawah.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors text-center"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/spaces"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors text-center"
          >
            Jelajahi Katalog Ruangan
          </Link>
        </div>
      </div>
    </div>
  );
}
