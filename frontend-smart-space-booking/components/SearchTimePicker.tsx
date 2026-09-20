"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faChevronDown,
  faXmark,
  faCheck,
  faSun,
  faCloudSun,
  faMoon,
  faBolt,
  faSliders,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

export interface TimePickerValue {
  duration: string;
  jamMulai: string;
  durasiJam: number;
  jamSelesai: string;
}

interface SearchTimePickerProps {
  value?: string;
  jamMulai?: string;
  durasiJam?: number;
  onChange: (val: TimePickerValue) => void;
  className?: string;
  label?: string;
}

const PRESET_SESSIONS = [
  {
    id: "full_day",
    title: "Seharian (09:00 - 18:00)",
    shortLabel: "Seharian",
    jamMulai: "09:00",
    durasiJam: 9,
    jamSelesai: "18:00",
    badge: "9 Jam",
    recommend: true,
    icon: faSun,
    desc: "Akses penuh jam kerja kantor, ideal untuk kerja fokus solo.",
  },
  {
    id: "morning",
    title: "Pagi (09:00 - 13:00)",
    shortLabel: "Sesi Pagi",
    jamMulai: "09:00",
    durasiJam: 4,
    jamSelesai: "13:00",
    badge: "4 Jam",
    recommend: false,
    icon: faCloudSun,
    desc: "Sesi pagi produktif sebelum makan siang.",
  },
  {
    id: "afternoon",
    title: "Siang (13:00 - 17:00)",
    shortLabel: "Sesi Siang",
    jamMulai: "13:00",
    durasiJam: 4,
    jamSelesai: "17:00",
    badge: "4 Jam",
    recommend: false,
    icon: faSun,
    desc: "Cocok untuk rapat tim, workshop, atau presentasi.",
  },
  {
    id: "evening",
    title: "Malam (17:00 - 21:00)",
    shortLabel: "Sesi Malam",
    jamMulai: "17:00",
    durasiJam: 4,
    jamSelesai: "21:00",
    badge: "4 Jam",
    recommend: false,
    icon: faMoon,
    desc: "Sesi kerja malam hari atau pertemuan santai.",
  },
  {
    id: "quick_2h",
    title: "Per Jam (2 Jam Sesi)",
    shortLabel: "2 Jam Sesi",
    jamMulai: "10:00",
    durasiJam: 2,
    jamSelesai: "12:00",
    badge: "2 Jam",
    recommend: false,
    icon: faBolt,
    desc: "Meeting singkat atau evaluasi cepat.",
  },
];

const AVAILABLE_START_HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const AVAILABLE_DURATIONS = [1, 2, 3, 4, 5, 6, 8, 9];

function calculateEndTime(startTime: string, hours: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const endHour = (h + hours) % 24;
  return `${String(endHour).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
}

export function SearchTimePicker({
  value = "Seharian (09:00 - 18:00)",
  jamMulai: propJamMulai = "09:00",
  durasiJam: propDurasiJam = 9,
  onChange,
  className = "",
  label = "Durasi Waktu",
}: SearchTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalBoxRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");

  const [tempJamMulai, setTempJamMulai] = useState(propJamMulai);
  const [tempDurasiJam, setTempDurasiJam] = useState(propDurasiJam);
  const [tempDurationText, setTempDurationText] = useState(value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTempDurationText(value);
    setTempJamMulai(propJamMulai);
    setTempDurasiJam(propDurasiJam);
  }, [value, propJamMulai, propDurasiJam]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const currentEndTime = useMemo(() => {
    return calculateEndTime(tempJamMulai, tempDurasiJam);
  }, [tempJamMulai, tempDurasiJam]);

  const displaySummary = useMemo(() => {
    const matchedPreset = PRESET_SESSIONS.find(
      (p) => p.title === value || p.shortLabel === value
    );
    if (matchedPreset) {
      return {
        title: matchedPreset.title,
        badge: matchedPreset.badge,
        sub: `${matchedPreset.jamMulai} - ${matchedPreset.jamSelesai}`,
      };
    }

    return {
      title: value,
      badge: `${tempDurasiJam} Jam`,
      sub: `${tempJamMulai} - ${currentEndTime}`,
    };
  }, [value, tempDurasiJam, tempJamMulai, currentEndTime]);

  const handleSelectPreset = (preset: (typeof PRESET_SESSIONS)[0]) => {
    setTempJamMulai(preset.jamMulai);
    setTempDurasiJam(preset.durasiJam);
    setTempDurationText(preset.title);

    onChange({
      duration: preset.title,
      jamMulai: preset.jamMulai,
      durasiJam: preset.durasiJam,
      jamSelesai: preset.jamSelesai,
    });

    setIsOpen(false);
  };

  const handleConfirmCustom = () => {
    const end = calculateEndTime(tempJamMulai, tempDurasiJam);
    const durationString = `${tempJamMulai} - ${end} (${tempDurasiJam} Jam)`;

    onChange({
      duration: durationString,
      jamMulai: tempJamMulai,
      durasiJam: tempDurasiJam,
      jamSelesai: end,
    });

    setIsOpen(false);
  };

  return (
    <div className={`relative select-none ${className}`}>
      <input type="hidden" name="duration" value={value} />
      <input type="hidden" name="jamMulai" value={propJamMulai} />
      <input type="hidden" name="durasiJam" value={propDurasiJam} />

      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
        <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-sky-600" />
        <span>{label}</span>
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`w-full text-left py-1.5 px-2 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer group ${
          isOpen
            ? "bg-sky-50 ring-1 ring-sky-500/40 text-sky-950"
            : "hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs sm:text-[13px] font-semibold text-slate-900 truncate tracking-tight">
            {displaySummary.title}
          </span>
          {displaySummary.badge && (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-sky-100 text-sky-800 border border-sky-200">
              {displaySummary.badge}
            </span>
          )}
        </div>

        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-sky-600" : "group-hover:text-slate-600"
          }`}
        />
      </button>

      {isOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          >
            <div
              ref={modalBoxRef}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-[430px] bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col justify-between overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Pilih Jam &amp; Durasi Sewa
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tentukan jadwal mulai dan durasi pemakaian
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Tutup dialog waktu"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-3.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("presets")}
                  className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "presets"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FontAwesomeIcon icon={faLayerGroup} className="w-3 h-3" />
                  <span>Sesi Populer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("custom")}
                  className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "custom"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FontAwesomeIcon icon={faSliders} className="w-3 h-3" />
                  <span>Atur Jam Kustom</span>
                </button>
              </div>

              {activeTab === "presets" && (
                <div className="space-y-2 mb-4">
                  {PRESET_SESSIONS.map((preset) => {
                    const isSelected =
                      tempDurationText === preset.title ||
                      (tempJamMulai === preset.jamMulai &&
                        tempDurasiJam === preset.durasiJam);

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-sky-50/80 border-sky-400 ring-2 ring-sky-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-sky-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <FontAwesomeIcon icon={preset.icon} className="w-3.5 h-3.5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {preset.shortLabel}
                              </p>
                              {preset.recommend && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Rekomendasi
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {preset.jamMulai} - {preset.jamSelesai}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold font-mono ${
                              isSelected
                                ? "bg-sky-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {preset.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "custom" && (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Jam Mulai Reservasi
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {AVAILABLE_START_HOURS.map((hour) => {
                        const isSelected = tempJamMulai === hour;
                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => setTempJamMulai(hour)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-sky-600 text-white font-bold shadow-xs scale-102"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80"
                            }`}
                          >
                            {hour}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Durasi Pemakaian Ruang
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {AVAILABLE_DURATIONS.map((dur) => {
                        const isSelected = tempDurasiJam === dur;
                        return (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setTempDurasiJam(dur)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-sky-600 text-white font-bold shadow-xs scale-102"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80"
                            }`}
                          >
                            {dur} Jam
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-sky-800 font-semibold uppercase">
                        Jadwal Waktu Sesi:
                      </span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">
                        {tempJamMulai} s/d {currentEndTime}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-xs">
                      {tempDurasiJam} Jam Total
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    Waktu Terpilih
                  </span>
                  <span className="font-semibold text-slate-800 text-xs font-mono">
                    {tempJamMulai} - {currentEndTime} ({tempDurasiJam} jam)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={
                    activeTab === "custom"
                      ? handleConfirmCustom
                      : () => {
                          const matched = PRESET_SESSIONS.find(
                            (p) => p.title === tempDurationText
                          );
                          if (matched) handleSelectPreset(matched);
                          else handleConfirmCustom();
                        }
                  }
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                  <span>Pilih Jam Ini</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
