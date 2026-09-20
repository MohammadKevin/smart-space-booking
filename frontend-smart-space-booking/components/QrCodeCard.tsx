"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, QrCode, Download } from "lucide-react";

interface QrCodeCardProps {
  value: string;
  size?: number;
  className?: string;
  showCopy?: boolean;
  showDownload?: boolean;
  label?: string;
}

export function QrCodeCard({
  value,
  size = 140,
  className = "",
  showCopy = true,
  showDownload = false,
  label,
}: QrCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-svg-${value}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = size * 2;
    canvas.height = size * 2;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `ticket-${value}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  return (
    <div
      className={`bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center space-y-2.5 transition-all ${className}`}
    >
      {label && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 tracking-tight">
          <QrCode className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>{label}</span>
        </div>
      )}

      <div className="relative p-2.5 bg-white rounded-lg border border-slate-200 shadow-inner flex items-center justify-center group">
        <QRCodeSVG
          id={`qr-svg-${value}`}
          value={value}
          size={size}
          level="H"
          includeMargin={false}
          className="rounded-md transition-transform group-hover:scale-102"
        />

        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-sky-600 pointer-events-none" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-sky-600 pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-sky-600 pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-sky-600 pointer-events-none" />
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between gap-1.5 bg-slate-50 hover:bg-sky-50/50 py-1.5 px-3 rounded-lg border border-slate-200 text-[11px] font-mono font-bold text-slate-800 transition-colors">
          <span className="truncate max-w-[170px] select-all">{value}</span>
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              title="Salin Kode Tiket"
              className="text-slate-400 hover:text-sky-600 transition-colors p-0.5 cursor-pointer shrink-0"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {showDownload && (
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline pt-0.5 cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-sky-600" />
          <span>Unduh Gambar QR</span>
        </button>
      )}
    </div>
  );
}
