"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface ImageUploaderProps {
  value?: string | null;
  onChange: (base64Url: string | undefined) => void;
  label?: string;
  helperText?: string;
}

export function ImageUploader({
  value,
  onChange,
  label = "Foto Ruangan / Workstation",
  helperText = "Pilih file gambar dari komputer (PNG, JPG, JPEG, WebP). Otomatis dioptimalkan dan disimpan di database.",
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      setPreview(value);
      if (value.startsWith("data:")) {
        const approxBytes = Math.round((value.length * 3) / 4);
        setFileSize(`${Math.round(approxBytes / 1024)} KB`);
      }
    } else {
      setPreview(null);
      setFileSize(null);
      setFileName(null);
    }
  }, [value]);

  const processAndCompressFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar (JPG, PNG, WebP).");
      return;
    }

    setProcessing(true);
    setFileName(file.name);

    try {
      const { uploadDirectToCloudinary } = await import("@/lib/cloudinary");
      const res = await uploadDirectToCloudinary(file);
      if (res && res.url) {
        setPreview(res.url);
        setFileSize(`${Math.round(file.size / 1024)} KB (Cloudinary CDN)`);
        onChange(res.url);
        setProcessing(false);
        return;
      }
    } catch (uploadErr: unknown) {
      const msg =
        uploadErr instanceof Error ? uploadErr.message : "Terjadi kesalahan saat upload gambar.";
      console.error("Gagal upload foto ke Cloudinary:", uploadErr);
      alert(`Gagal mengunggah foto ke Cloudinary: ${msg}`);
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndCompressFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndCompressFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileSize(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onChange(undefined);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">{label}</label>
          {fileSize && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Ukuran: {fileSize}
            </span>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="relative aspect-[16/9] w-full max-h-44 bg-slate-900/5">
            <img
              src={preview}
              alt="Preview Foto"
              className="w-full h-full object-cover rounded-t-xl"
            />
          </div>

          <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {fileName || "Foto Ruangan Terlampir"}
                </p>
                <p className="text-[11px] text-slate-500">Tersimpan di database (File Lokal)</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Ganti</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
              >
                <X className="w-3 h-3" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-sky-500 bg-sky-50/50"
              : "border-slate-300 hover:border-sky-500 bg-slate-50/60 hover:bg-slate-50"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
              {processing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-800">
                {processing ? "Mengoptimalkan gambar..." : "Klik untuk upload foto dari komputer"}
              </p>
              <p className="text-[11px] text-slate-500">atau drag & drop file ke area ini</p>
            </div>

            <span className="text-[10px] font-medium text-slate-400">
              Format: PNG, JPG, JPEG, WebP (Maks. 10MB)
            </span>
          </div>
        </div>
      )}

      {helperText && !preview && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
