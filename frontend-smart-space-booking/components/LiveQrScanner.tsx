"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw, AlertCircle, Sparkles, Volume2 } from "lucide-react";

interface LiveQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isProcessing?: boolean;
}

export function LiveQrScanner({ onScanSuccess, isProcessing = false }: LiveQrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const scannerElementId = "interactive-qr-reader";

  // Play audio chime using Web Audio API
  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6 note

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio fallback
    }
  };

  // Get available camera devices
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const list = devices.map((d) => ({
            id: d.id,
            label: d.label || `Kamera ${d.id.slice(0, 5)}`,
          }));
          setCameras(list);
          // Prefer back / environment camera if available
          const backCam = list.find((c) =>
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
        console.warn("Gagal memuat daftar kamera:", err);
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
      // Cooldown 3 seconds for duplicate scan
      if (decodedText === lastScannedCode && now - lastScannedTimeRef.current < 3000) {
        return;
      }

      lastScannedTimeRef.current = now;
      setLastScannedCode(decodedText);
      playBeep();
      onScanSuccess(decodedText.trim());
    },
    [lastScannedCode, onScanSuccess]
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
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      };

      const cameraId = selectedCameraId || { facingMode: "environment" };

      await scannerRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {
          // Frame error (silenced while searching)
        }
      );

      setIsScanning(true);
    } catch (err: unknown) {
      console.error("Gagal memulai scanner:", err);
      setError("Gagal mengakses kamera. Pastikan izin kamera telah diizinkan pada browser.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (err) {
      console.warn("Error stopping scanner:", err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl overflow-hidden border border-slate-800 shadow-md">
      {/* Header Bar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isScanning ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isScanning ? "Live Scanner Aktif" : "Scanner Siaga"}
          </span>
        </div>

        {/* Camera Selector & Action Buttons */}
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              disabled={isScanning}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none disabled:opacity-60"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          )}

          {isScanning ? (
            <button
              type="button"
              onClick={stopScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Matikan Kamera</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Nyalakan Kamera</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport Container */}
      <div className="relative bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
        <div id={scannerElementId} className="w-full max-w-[420px]" />

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/90 backdrop-blur-xs">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Camera className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h4 className="text-sm font-bold text-slate-200">Kamera Belum Aktif</h4>
              <p className="text-xs text-slate-400">
                Klik tombol di bawah untuk mulai memindai barcode QR tiket pengunjung secara otomatis.
              </p>
            </div>
            <button
              type="button"
              onClick={startScanner}
              className="py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Mulai Scan Kamera</span>
            </button>
          </div>
        )}

        {/* Scanning Target Overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-cyan-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-cyan-400 rounded-tl-md" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-cyan-400 rounded-tr-md" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-cyan-400 rounded-bl-md" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-cyan-400 rounded-br-md" />

              {/* Animated Laser Scan Bar */}
              <div className="w-full h-0.5 bg-cyan-400/90 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-10 space-y-2">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center gap-3 shadow-xl">
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-xs font-bold text-slate-100">Memvalidasi Tiket...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950 text-slate-400 text-[11px] flex items-center justify-between border-t border-slate-800">
        <div className="flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Audio Beep aktif saat QR terbaca</span>
        </div>
        {lastScannedCode && (
          <span className="font-mono text-cyan-400 text-[10px] truncate max-w-[200px]">
            Terakhir: {lastScannedCode}
          </span>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-rose-950/80 border-t border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
