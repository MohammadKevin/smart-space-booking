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

  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
  };

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
        () => {}
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
    <div className="bg-slate-900 text-white rounded-xs overflow-hidden border border-slate-800 shadow-md">
      <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isScanning ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
            {isScanning ? "Live Scanner Aktif" : "Scanner Siaga"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              disabled={isScanning}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-xs border border-slate-700 focus:outline-none disabled:opacity-60 cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Matikan Kamera</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-semibold rounded-xs transition-colors shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Nyalakan Kamera</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative bg-black min-h-[280px] flex items-center justify-center overflow-hidden">
        <div id={scannerElementId} className="w-full max-w-[420px]" />

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/90 backdrop-blur-xs">
            <div className="w-12 h-12 rounded-xs bg-[#006370]/20 border border-[#006370]/40 text-[#006370] flex items-center justify-center">
              <Camera className="w-6 h-6 text-cyan-400" />
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
              className="py-2 px-4 rounded-xs bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Mulai Scan Kamera</span>
            </button>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-52 h-52 border-2 border-[#006370] rounded-xs relative shadow-[0_0_20px_rgba(0,99,112,0.4)]">
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
              <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-10 space-y-2">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xs flex items-center gap-3 shadow-xl">
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-xs font-bold text-slate-100">Memvalidasi Tiket...</span>
            </div>
          </div>
        )}
      </div>

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

      {error && (
        <div className="p-3 bg-rose-950/80 border-t border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
