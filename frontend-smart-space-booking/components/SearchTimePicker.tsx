"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faChevronDown,
  faXmark,
  faCheck,
  faSliders,
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
  },
  {
    id: "morning",
    title: "Pagi (09:00 - 13:00)",
    shortLabel: "Sesi Pagi",
    jamMulai: "09:00",
    durasiJam: 4,
    jamSelesai: "13:00",
    badge: "4 Jam",
  },
  {
    id: "afternoon",
    title: "Siang (13:00 - 17:00)",
    shortLabel: "Sesi Siang",
    jamMulai: "13:00",
    durasiJam: 4,
    jamSelesai: "17:00",
    badge: "4 Jam",
  },
  {
    id: "evening",
    title: "Malam (17:00 - 21:00)",
    shortLabel: "Sesi Malam",
    jamMulai: "17:00",
    durasiJam: 4,
    jamSelesai: "21:00",
    badge: "4 Jam",
  },
  {
    id: "quick_2h",
    title: "Per Jam (2 Jam Sesi)",
    shortLabel: "Sesi Singkat (2 Jam)",
    jamMulai: "10:00",
    durasiJam: 2,
    jamSelesai: "12:00",
    badge: "2 Jam",
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

const AVAILABLE_DURATIONS = [1, 2, 3, 4, 6, 8, 9];

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
  const [showCustom, setShowCustom] = useState(false);

  const [tempJamMulai, setTempJamMulai] = useState(propJamMulai);
  const [tempDurasiJam, setTempDurasiJam] = useState(propDurasiJam);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTempJamMulai(propJamMulai);
    setTempDurasiJam(propDurasiJam);
  }, [propJamMulai, propDurasiJam]);

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

  const displayTitle = useMemo(() => {
    const matched = PRESET_SESSIONS.find((p) => p.title === value || p.shortLabel === value);
    if (matched) return matched.title;
    return value;
  }, [value]);

  const handleSelectPreset = (preset: (typeof PRESET_SESSIONS)[0]) => {
    setTempJamMulai(preset.jamMulai);
    setTempDurasiJam(preset.durasiJam);

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

      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
        <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-sky-600" />
        <span>{label}</span>
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="w-full text-left py-1.5 pr-6 rounded-lg flex items-center justify-between gap-2 cursor-pointer relative focus:outline-none"
      >
        <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
          {displayTitle}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-3 h-3 text-slate-400 absolute right-1 top-2.5 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-sky-600" : ""
          }`}
        />
      </button>

      {isOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200/90 p-5 animate-in zoom-in-95 duration-150 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Pilih Waktu Sewa
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                </button>
              </div>

              {!showCustom ? (
                /* Preset Sessions */
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    {PRESET_SESSIONS.map((preset) => {
                      const isSelected =
                        value === preset.title ||
                        (propJamMulai === preset.jamMulai && propDurasiJam === preset.durasiJam);

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                            isSelected
                              ? "bg-sky-50/80 border-sky-400 font-bold text-sky-950 ring-1 ring-sky-500/20"
                              : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{preset.shortLabel}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({preset.jamMulai} - {preset.jamSelesai})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                              {preset.badge}
                            </span>
                            {isSelected && (
                              <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-sky-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCustom(true)}
                    className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-sky-600 transition-colors flex items-center justify-center gap-1.5 pt-1 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faSliders} className="w-3 h-3" />
                    <span>Atur jam mulai & durasi manual</span>
                  </button>
                </div>
              ) : (
                /* Custom Selection */
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Jam Mulai
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {AVAILABLE_START_HOURS.map((hour) => {
                        const isSelected = tempJamMulai === hour;
                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => setTempJamMulai(hour)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-sky-600 text-white font-bold"
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
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Durasi
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {AVAILABLE_DURATIONS.map((dur) => {
                        const isSelected = tempDurasiJam === dur;
                        return (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setTempDurasiJam(dur)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-sky-600 text-white font-bold"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80"
                            }`}
                          >
                            {dur} Jam
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCustom(false)}
                      className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      Kembali
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmCustom}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                      <span>{tempJamMulai} - {currentEndTime}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
