"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertCircle,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  FlipHorizontal,
  QrCode,
  Sparkles,
} from "lucide-react";

interface LiveQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isProcessing?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function LiveQrScanner({
  onScanSuccess,
  isProcessing = false,
  isFullscreen = false,
  onToggleFullscreen,
}: LiveQrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string | null>(null);
  const isProcessingRef = useRef<boolean>(isProcessing);
  const onScanSuccessRef = useRef(onScanSuccess);
  const scannerElementId = useRef(`interactive-qr-reader-${Math.random().toString(36).substring(2, 7)}`).current;

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const playBeep = useCallback(() => {
    if (muted) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(920, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1840, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }, [muted]);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const list = devices.map((d) => ({
            id: d.id,
            label: d.label || `Kamera ${d.id.slice(0, 5)}`,
          }));
          setCameras(list);
          const backCam = list.find(
            (c) =>
              c.label.toLowerCase().includes("back") ||
              c.label.toLowerCase().includes("rear") ||
              c.label.toLowerCase().includes("belakang") ||
              c.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCam ? backCam.id : list[0].id);
        } else {
          setError("Tidak ada perangkat kamera yang terdeteksi.");
        }
      })
      .catch(() => {
        setError("Izin akses kamera belum diberikan.");
      });

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current.clear();
      }
    };
  }, []);

  const handleDecodedText = useCallback(
    (decodedText: string) => {
      if (!decodedText || isProcessingRef.current) {
        return;
      }

      const trimmed = decodedText.trim();
      const now = Date.now();

      // Debounce the exact same code for 2.5 seconds to prevent flood
      if (
        trimmed === lastScannedCodeRef.current &&
        now - lastScannedTimeRef.current < 2500
      ) {
        return;
      }

      lastScannedCodeRef.current = trimmed;
      lastScannedTimeRef.current = now;
      setLastScannedCode(trimmed);
      playBeep();

      if (onScanSuccessRef.current) {
        onScanSuccessRef.current(trimmed);
      }
    },
    [playBeep]
  );

  const startScanner = async () => {
    setError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const cameraId = selectedCameraId || { facingMode: "environment" };

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: isFullscreen ? { width: 280, height: 280 } : { width: 230, height: 230 },
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
    } catch {
      setError("Gagal mengakses kamera. Pastikan izin kamera telah diizinkan pada browser Anda.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {
    } finally {
      setIsScanning(false);
    }
  };

  const toggleMirror = () => {
    setIsMirrored((prev) => !prev);
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all ${
        isFullscreen
          ? "h-full flex flex-col justify-between bg-slate-950 text-white"
          : "bg-white border border-slate-200 text-slate-900 shadow-xs"
      }`}
    >
      <style jsx global>{`
        .qr-scanner-wrapper video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 0.75rem !important;
        }
        .qr-scanner-wrapper.is-mirrored video {
          transform: scaleX(-1) !important;
          -webkit-transform: scaleX(-1) !important;
        }
        .qr-scanner-wrapper.not-mirrored video {
          transform: scaleX(1) !important;
          -webkit-transform: scaleX(1) !important;
        }
        @keyframes scanBeam {
          0% {
            top: 5%;
            opacity: 0.8;
          }
          50% {
            top: 90%;
            opacity: 1;
          }
          100% {
            top: 5%;
            opacity: 0.8;
          }
        }
        .animate-scan-beam {
          animation: scanBeam 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      <div
        className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
          isFullscreen
            ? "bg-slate-900/90 border-slate-800 text-white"
            : "bg-slate-50/80 border-slate-200 text-slate-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isScanning
                ? isProcessing
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500 animate-pulse"
                : "bg-slate-400"
            }`}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
            {isScanning
              ? isProcessing
                ? "Memvalidasi Tiket..."
                : "Kamera Aktif • Siap Scan"
              : "Kamera Siaga"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              disabled={isScanning}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none disabled:opacity-60 cursor-pointer ${
                isFullscreen
                  ? "bg-slate-800 text-slate-200 border-slate-700"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          )}

          {isScanning && (
            <button
              type="button"
              onClick={toggleMirror}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isFullscreen
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                  : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
              title={isMirrored ? "Matikan Efek Cermin (Un-mirror)" : "Balik Kamera (Mirror)"}
            >
              <FlipHorizontal className={`w-3.5 h-3.5 ${isMirrored ? "text-sky-500" : ""}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isFullscreen
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
            }`}
            title={muted ? "Nyalakan Suara" : "Bisukan Suara"}
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </button>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isFullscreen
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kecilkan</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Layar Penuh</span>
                </>
              )}
            </button>
          )}

          {isScanning ? (
            <button
              type="button"
              onClick={stopScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Matikan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs shadow-sky-600/25 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Nyalakan</span>
            </button>
          )}
        </div>
      </div>

      <div
        className={`relative flex items-center justify-center overflow-hidden ${
          isFullscreen
            ? "flex-1 w-full bg-slate-950"
            : "min-h-[290px] bg-slate-900 border-y border-slate-800"
        }`}
      >
        <div
          id={scannerElementId}
          className={`qr-scanner-wrapper w-full max-w-[480px] ${
            isMirrored ? "is-mirrored" : "not-mirrored"
          }`}
        />

        {!isScanning && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3.5 ${
              isFullscreen ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-xs">
              <QrCode className="w-7 h-7 text-sky-600" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h4 className="text-sm font-bold text-slate-900">
                {isFullscreen ? "Kamera Belum Aktif" : "Scanner Kamera Siaga"}
              </h4>
              <p className="text-xs text-slate-500">
                Nyalakan kamera untuk memindai barcode QR reservasi tamu secara langsung.
              </p>
            </div>
            <button
              type="button"
              onClick={startScanner}
              className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold transition-all shadow-sm shadow-sky-600/25 flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-sky-100" />
              <span>Mulai Scan Kamera</span>
            </button>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
            <div
              className={`border-2 border-sky-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(56,189,248,0.25)] ${
                isFullscreen
                  ? "w-72 h-72 sm:w-80 sm:h-80"
                  : "w-48 h-48 sm:w-52 sm:h-52 max-w-[70vw] max-h-[70vw]"
              }`}
            >
              {/* Corner brackets */}
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-3 border-l-3 border-sky-400 rounded-tl-lg" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-3 border-r-3 border-sky-400 rounded-tr-lg" />
              <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-3 border-l-3 border-sky-400 rounded-bl-lg" />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-3 border-r-3 border-sky-400 rounded-br-lg" />

              {/* Scanning light beam */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-scan-beam" />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-20 animate-in fade-in">
            <div className="bg-white border border-slate-200 py-3.5 px-5 rounded-2xl flex items-center gap-3 shadow-2xl">
              <RefreshCw className="w-5 h-5 text-sky-600 animate-spin" />
              <div>
                <p className="text-xs font-bold text-slate-900">Memvalidasi Tiket...</p>
                <p className="text-[10px] text-slate-500">Memeriksa status reservasi</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className={`p-3 text-[11px] flex items-center justify-between border-t shrink-0 ${
          isFullscreen
            ? "bg-slate-900 border-slate-800 text-slate-400"
            : "bg-slate-50/80 border-slate-200 text-slate-500"
        }`}
      >
        <span>Arahkan kode QR ke dalam bingkai pemindai</span>
        {lastScannedCode && (
          <span className="font-mono text-sky-600 font-bold text-[10px] truncate max-w-[220px]">
            Terakhir: {lastScannedCode}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
