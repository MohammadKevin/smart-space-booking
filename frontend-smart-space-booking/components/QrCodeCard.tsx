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
  size = 160,
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
    } catch {
    }
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
      className={`bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3 ${className}`}
    >
      {label && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <QrCode className="w-3.5 h-3.5 text-cyan-600" />
          <span>{label}</span>
        </div>
      )}

      <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-inner flex items-center justify-center">
        <QRCodeSVG
          id={`qr-svg-${value}`}
          value={value}
          size={size}
          level="H"
          includeMargin={false}
          className="rounded-xs"
        />
      </div>

      <div className="space-y-1 w-full">
        <div className="flex items-center justify-center gap-2 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800">
          <span className="truncate max-w-[200px]">{value}</span>
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              title="Salin Kode Tiket"
              className="text-slate-400 hover:text-cyan-600 transition-colors p-0.5"
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
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 hover:text-cyan-800 hover:underline pt-1"
        >
          <Download className="w-3 h-3" />
          <span>Simpan Gambar QR</span>
        </button>
      )}
    </div>
  );
}
