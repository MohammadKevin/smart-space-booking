"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faArrowRotateLeft,
  faXmark,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

interface SearchDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function SearchDatePicker({
  value,
  onChange,
  className = "",
  label = "Tanggal",
}: SearchDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const toIsoString = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const todayIso = useMemo(() => {
    return toIsoString(todayYear, todayMonth, todayDate);
  }, [todayYear, todayMonth, todayDate]);

  const tomorrowIso = useMemo(() => {
    const tm = new Date(todayYear, todayMonth, todayDate + 1);
    return toIsoString(tm.getFullYear(), tm.getMonth(), tm.getDate());
  }, [todayYear, todayMonth, todayDate]);

  const lusaIso = useMemo(() => {
    const ls = new Date(todayYear, todayMonth, todayDate + 2);
    return toIsoString(ls.getFullYear(), ls.getMonth(), ls.getDate());
  }, [todayYear, todayMonth, todayDate]);

  const weekendIso = useMemo(() => {
    const d = new Date(todayYear, todayMonth, todayDate);
    const dayOfWeek = d.getDay();
    const diff = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    return toIsoString(d.getFullYear(), d.getMonth(), d.getDate());
  }, [todayYear, todayMonth, todayDate]);

  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        return new Date(y, m - 1, 1);
      }
    }
    return new Date(todayYear, todayMonth, 1);
  });

  useEffect(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setViewDate(new Date(y, m - 1, 1));
      }
    }
  }, [value]);

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

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const isCurrentOrPastMonth =
    viewYear === todayYear && viewMonth <= todayMonth;

  const handlePrevMonth = () => {
    if (isCurrentOrPastMonth) return;
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const displayDetails = useMemo(() => {
    if (!value) {
      return {
        title: "Pilih Tanggal",
        badge: null,
        sub: "Kapan Anda butuh ruang?",
      };
    }

    const [y, m, d] = value.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const shortDay = dateObj.toLocaleDateString("id-ID", { weekday: "short" });
    const fullDay = dateObj.toLocaleDateString("id-ID", { weekday: "long" });
    const shortMonth = dateObj.toLocaleDateString("id-ID", { month: "short" });

    if (value === todayIso) {
      return {
        title: `Hari Ini, ${d} ${shortMonth}`,
        badge: "Hari Ini",
        sub: `${fullDay}, ${d} ${MONTH_NAMES[m - 1]} ${y}`,
      };
    }

    if (value === tomorrowIso) {
      return {
        title: `Besok, ${d} ${shortMonth}`,
        badge: "Besok",
        sub: `${fullDay}, ${d} ${MONTH_NAMES[m - 1]} ${y}`,
      };
    }

    return {
      title: `${shortDay}, ${d} ${shortMonth} ${y}`,
      badge: null,
      sub: `${fullDay}, ${d} ${MONTH_NAMES[m - 1]} ${y}`,
    };
  }, [value, todayIso, tomorrowIso]);

  const handleSelect = (isoDate: string) => {
    onChange(isoDate);
    setIsOpen(false);
  };

  return (
    <div className={`relative select-none ${className}`}>
      <input type="hidden" name="date" value={value} />

      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
        <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3 text-sky-600" />
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
            {displayDetails.title}
          </span>
          {displayDetails.badge && (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-sky-100 text-sky-800 border border-sky-200">
              {displayDetails.badge}
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
              className="relative w-full max-w-sm sm:max-w-[390px] bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faCalendarDays} className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Pilih Tanggal Reservasi
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tentukan jadwal ruang kerja Anda
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Tutup dialog kalender"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-slate-100 overflow-x-auto text-xs [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => handleSelect(todayIso)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 text-[11px] ${
                    value === todayIso
                      ? "bg-sky-600 text-white shadow-xs shadow-sky-600/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(tomorrowIso)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 text-[11px] ${
                    value === tomorrowIso
                      ? "bg-sky-600 text-white shadow-xs shadow-sky-600/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Besok
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(lusaIso)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 text-[11px] ${
                    value === lusaIso
                      ? "bg-sky-600 text-white shadow-xs shadow-sky-600/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Lusa
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(weekendIso)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 text-[11px] ${
                    value === weekendIso
                      ? "bg-sky-600 text-white shadow-xs shadow-sky-600/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Akhir Pekan
                </button>
              </div>

              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="font-bold text-slate-900 text-sm tracking-tight">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    disabled={isCurrentOrPastMonth}
                    aria-label="Bulan Sebelumnya"
                    className={`p-1.5 rounded-lg transition-colors ${
                      isCurrentOrPastMonth
                        ? "text-slate-200 cursor-not-allowed"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                    }`}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Bulan Berikutnya"
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAY_LABELS.map((d, index) => (
                  <span
                    key={d}
                    className={`text-[11px] font-semibold py-0.5 font-mono ${
                      index === 0 ? "text-rose-500" : "text-slate-400"
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`blank-${i}`} className="w-8 h-8 sm:w-9 sm:h-9 mx-auto" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateIso = toIsoString(viewYear, viewMonth, day);
                  const checkDate = new Date(viewYear, viewMonth, day);
                  const nowDate = new Date(todayYear, todayMonth, todayDate);
                  const isPast = checkDate < nowDate;
                  const isCurrentDay =
                    viewYear === todayYear &&
                    viewMonth === todayMonth &&
                    day === todayDate;
                  const isSelected = value === dateIso;

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleSelect(dateIso)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 mx-auto flex items-center justify-center rounded-xl text-xs sm:text-[13px] font-semibold transition-all relative cursor-pointer ${
                        isSelected
                          ? "bg-sky-600 text-white font-bold shadow-md shadow-sky-600/30 scale-105"
                          : isPast
                          ? "text-slate-300 cursor-not-allowed"
                          : isCurrentDay
                          ? "text-sky-600 border border-sky-400 bg-sky-50 font-bold"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
                      }`}
                    >
                      {day}
                      {isCurrentDay && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    Tanggal Terpilih
                  </span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {displayDetails.sub}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                  <span>Pilih</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
