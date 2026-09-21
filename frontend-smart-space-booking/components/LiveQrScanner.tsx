"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";
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
  const scannerElementId = "interactive-qr-reader";
  const forceUnmirrorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [muted]);

  const enforceOrientation = useCallback((mirror: boolean) => {
    const container = document.getElementById(scannerElementId);
    if (!container) return;
    const video = container.querySelector("video");
    if (video) {
      const transformValue = mirror ? "scaleX(-1)" : "scaleX(1)";
      video.style.setProperty("transform", transformValue, "important");
      video.style.setProperty("-webkit-transform", transformValue, "important");
      video.style.setProperty("-moz-transform", transformValue, "important");
      video.style.setProperty("object-fit", "cover", "important");
    }
  }, []);

  useEffect(() => {
    if (isScanning) {
      enforceOrientation(isMirrored);
      forceUnmirrorTimerRef.current = setInterval(() => {
        enforceOrientation(isMirrored);
      }, 500);
    } else {
      if (forceUnmirrorTimerRef.current) {
        clearInterval(forceUnmirrorTimerRef.current);
        forceUnmirrorTimerRef.current = null;
      }
    }

    return () => {
      if (forceUnmirrorTimerRef.current) {
        clearInterval(forceUnmirrorTimerRef.current);
        forceUnmirrorTimerRef.current = null;
      }
    };
  }, [isScanning, isMirrored, enforceOrientation]);

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
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      if (forceUnmirrorTimerRef.current) {
        clearInterval(forceUnmirrorTimerRef.current);
      }
    };
  }, []);

  const handleScan = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      if (
        decodedText === lastScannedCode &&
        now - lastScannedTimeRef.current < 3000
      ) {
        return;
      }

      lastScannedTimeRef.current = now;
      setLastScannedCode(decodedText);
      playBeep();
      onScanSuccess(decodedText.trim());
    },
    [lastScannedCode, onScanSuccess, playBeep]
  );

  const startScanner = async () => {
    setError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerElementId);
      }

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const config: Html5QrcodeCameraScanConfig = {
        fps: 15,
        qrbox: isFullscreen ? { width: 280, height: 280 } : { width: 220, height: 220 },
        aspectRatio: isFullscreen ? undefined : 1.0,
      };

      const cameraId = selectedCameraId || { facingMode: "environment" };

      await scannerRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
      setTimeout(() => enforceOrientation(isMirrored), 150);
    } catch {
      setError("Gagal mengakses kamera. Pastikan izin kamera telah diizinkan pada browser.");
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
      if (forceUnmirrorTimerRef.current) {
        clearInterval(forceUnmirrorTimerRef.current);
        forceUnmirrorTimerRef.current = null;
      }
    }
  };

  const toggleMirror = () => {
    const next = !isMirrored;
    setIsMirrored(next);
    enforceOrientation(next);
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all ${
        isFullscreen
          ? "h-full flex flex-col justify-between bg-slate-950 text-white"
          : "bg-white border border-slate-200 text-slate-900 shadow-xs"
      }`}
    >
      <div
        className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
          isFullscreen
            ? "bg-slate-900/90 border-slate-800 text-white"
            : "bg-slate-50/80 border-slate-200 text-slate-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isScanning ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {isScanning ? "Kamera Aktif" : "Kamera Siaga"}
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
              <FlipHorizontal className={`w-3.5 h-3.5 ${isMirrored ? "text-sky-600" : ""}`} />
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
            title={muted ? "Nyalakan Audio" : "Bisukan Audio"}
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
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
            : "min-h-[290px] bg-slate-100/70 border-y border-slate-100"
        }`}
      >
        <div id={scannerElementId} className="w-full max-w-[480px]" />

        {!isScanning && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 ${
              isFullscreen ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <Camera className="w-6 h-6 text-sky-600" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h4 className="text-sm font-bold text-slate-900">
                {isFullscreen ? "Kamera Belum Aktif" : "Scanner Siaga"}
              </h4>
              <p className="text-xs text-slate-500">
                Nyalakan kamera untuk memindai kode QR tiket tamu secara instan.
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
              className={`border-2 border-sky-500 rounded-2xl relative shadow-md ${
                isFullscreen
                  ? "w-72 h-72 sm:w-80 sm:h-80"
                  : "w-48 h-48 sm:w-52 sm:h-52 max-w-[70vw] max-h-[70vw]"
              }`}
            >
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-sky-600 rounded-tl-md" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-sky-600 rounded-tr-md" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-sky-600 rounded-bl-md" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-sky-600 rounded-br-md" />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-lg">
              <RefreshCw className="w-5 h-5 text-sky-600 animate-spin" />
              <span className="text-xs font-bold text-slate-800">Memvalidasi Tiket...</span>
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
        <span>Posisikan barcode QR di dalam bingkai</span>
        {lastScannedCode && (
          <span className="font-mono text-sky-600 font-bold text-[10px] truncate max-w-[200px]">
            Terakhir: {lastScannedCode}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
