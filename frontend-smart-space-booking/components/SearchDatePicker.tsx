"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface SearchDatePickerProps {
  value: string; // ISO "YYYY-MM-DD"
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Reference for "today" in local timezone
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
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
    const diff = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    return toIsoString(d.getFullYear(), d.getMonth(), d.getDate());
  }, [todayYear, todayMonth, todayDate]);

  // View state for the calendar month navigation
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        return new Date(y, m - 1, 1);
      }
    }
    return new Date(todayYear, todayMonth, 1);
  });

  // Sync viewed month when value changes from outside
  useEffect(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setViewDate(new Date(y, m - 1, 1));
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
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

  // Days calculations
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Trigger label details
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
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Hidden input for standard forms */}
      <input type="hidden" name="date" value={value} />

      {/* Label */}
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
        <CalendarIcon className="w-3.5 h-3.5 text-[#006370]" />
        <span>{label}</span>
      </label>

      {/* Custom Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`w-full text-left py-1 px-1.5 -mx-1.5 rounded-sm flex items-center justify-between gap-2 transition-all cursor-pointer group ${
          isOpen
            ? "bg-slate-100/80 ring-1 ring-[#006370]/30"
            : "hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs sm:text-[13px] font-semibold text-slate-900 truncate tracking-tight">
            {displayDetails.title}
          </span>
          {displayDetails.badge && (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold rounded bg-[#006370]/10 text-[#006370] border border-[#006370]/20">
              {displayDetails.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#006370]" : "group-hover:text-slate-600"
          }`}
        />
      </button>

      {/* Floating Popover Calendar */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto lg:left-0 top-[calc(100%+8px)] z-50 w-76 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200/90 p-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-slate-100 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => handleSelect(todayIso)}
              className={`px-2.5 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                value === todayIso
                  ? "bg-[#006370] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleSelect(tomorrowIso)}
              className={`px-2.5 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                value === tomorrowIso
                  ? "bg-[#006370] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Besok
            </button>
            <button
              type="button"
              onClick={() => handleSelect(lusaIso)}
              className={`px-2.5 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                value === lusaIso
                  ? "bg-[#006370] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Lusa
            </button>
            <button
              type="button"
              onClick={() => handleSelect(weekendIso)}
              className={`px-2.5 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                value === weekendIso
                  ? "bg-[#006370] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Akhir Pekan
            </button>
          </div>

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-slate-900 text-sm tracking-tight">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={isCurrentOrPastMonth}
                aria-label="Bulan Sebelumnya"
                className={`p-1 rounded-md transition-colors ${
                  isCurrentOrPastMonth
                    ? "text-slate-200 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Bulan Berikutnya"
                className="p-1 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_LABELS.map((d, index) => (
              <span
                key={d}
                className={`text-[11px] font-semibold py-1 font-mono ${
                  index === 0 ? "text-rose-500" : "text-slate-400"
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="w-8 h-8" />
            ))}

            {/* Days in Month */}
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
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${
                    isSelected
                      ? "bg-[#006370] text-white font-bold shadow-sm shadow-[#006370]/30 scale-105"
                      : isPast
                      ? "text-slate-300 cursor-not-allowed"
                      : isCurrentDay
                      ? "text-[#006370] border border-[#006370] hover:bg-[#006370]/10 font-bold"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
                  }`}
                >
                  {day}
                  {isCurrentDay && !isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#006370]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer with Info & Quick Reset */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate pr-2 font-medium text-slate-600">
              {displayDetails.sub}
            </span>

            {value !== todayIso && (
              <button
                type="button"
                onClick={() => handleSelect(todayIso)}
                className="flex items-center gap-1 text-[10px] font-semibold text-[#006370] hover:underline cursor-pointer shrink-0"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Hari Ini</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
