import React from "react";

interface WorkNestLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  tag?: string;
  className?: string;
}

export function WorkNestLogo({
  size = "md",
  showText = true,
  tag,
  className = "",
}: WorkNestLogoProps) {
  const iconDimensions = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-9 h-9",
  }[size];

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${iconDimensions} rounded-xl bg-sky-600 flex items-center justify-center shadow-sm shrink-0 p-1`}
      >
        <img
          src="/logo-worknest.png"
          alt="WorkNest Logo"
          className="w-full h-full object-contain rounded-lg"
        />
      </div>

      {showText && (
        <div className="flex items-center gap-2">
          <span
            className={`font-black tracking-tight text-slate-900 ${textSizes}`}
          >
            WorkNest
          </span>
          {tag && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
              {tag}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
