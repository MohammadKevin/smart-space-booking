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

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const scannerElementId = "interactive-qr-reader";

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

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
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
      .catch((err) => {
        setError("Izin akses kamera belum diberikan.");
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
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
        qrbox: isFullscreen ? { width: 300, height: 300 } : { width: 240, height: 240 },
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
    } catch (err: unknown) {
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
    }
  };

  return (
    <div
      className={`bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-md ${
        isFullscreen ? "h-full flex flex-col justify-between" : ""
      }`}
    >
      <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isScanning ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
            }`}
          />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
            {isScanning ? "Scanner Aktif" : "Scanner Siaga"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              disabled={isScanning}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none disabled:opacity-60 cursor-pointer"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={muted ? "Nyalakan Beep" : "Bisukan Beep"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Matikan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-sky-600/25 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Nyalakan</span>
            </button>
          )}
        </div>
      </div>

      <div
        className={`relative bg-black flex items-center justify-center overflow-hidden ${
          isFullscreen ? "flex-1 w-full" : "min-h-[280px]"
        }`}
      >
        <div id={scannerElementId} className="w-full max-w-[500px]" />

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/90 backdrop-blur-xs">
            <div className="w-12 h-12 rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-400 flex items-center justify-center">
              <Camera className="w-6 h-6 text-sky-400" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h4 className="text-sm font-bold text-slate-200">Kamera Belum Aktif</h4>
              <p className="text-xs text-slate-400">
                Nyalakan scanner kamera untuk membaca barcode tiket QR tamu otomatis.
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
              className={`border-2 border-sky-500 rounded-2xl relative shadow-[0_0_30px_rgba(2,132,199,0.5)] ${
                isFullscreen ? "w-72 h-72 sm:w-80 sm:h-80" : "w-52 h-52 max-w-[70vw] max-h-[70vw]"
              }`}
            >
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-lg" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-lg" />
              <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-lg" />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-lg" />
              <div className="w-full h-0.5 bg-sky-400 shadow-[0_0_12px_#38bdf8] animate-pulse" />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center gap-3 shadow-xl">
              <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />
              <span className="text-xs font-bold text-slate-100">Memvalidasi Tiket...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-950 text-slate-400 text-[11px] flex items-center justify-between border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <span>Arahkan barcode QR ke dalam kotak scanner</span>
        </div>
        {lastScannedCode && (
          <span className="font-mono text-sky-400 text-[10px] truncate max-w-[200px]">
            Terakhir: {lastScannedCode}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-950/80 border-t border-rose-800 text-rose-300 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
