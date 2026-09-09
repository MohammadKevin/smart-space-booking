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
        className={`${iconDimensions} rounded-[8px] bg-gradient-to-br from-[#0284C7] via-[#0284C7] to-[#0D9488] flex items-center justify-center shadow-xs shrink-0 p-1.5`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          
          <path
            d="M4 17L9 8L12 13L15 8L20 17"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="7" r="1.6" fill="currentColor" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center gap-2">
          <span
            className={`font-black tracking-tight text-slate-900 ${textSizes}`}
          >
            WorkNest
          </span>
          {tag && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
              {tag}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
