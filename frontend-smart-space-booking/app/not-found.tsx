"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkNestLogo } from "@/components/WorkNestLogo";
import {
  Search,
  ArrowLeft,
  LayoutDashboard,
  Compass,
  CalendarCheck,
  Headphones,
  ShieldCheck,
  ExternalLink,
  Lock,
  Radio,
  FileQuestion,
  HelpCircle,
} from "lucide-react";

export default function NotFoundPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/spaces?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFDFD] text-slate-900 flex flex-col justify-between font-sans">
      
      <header className="bg-white border-b border-slate-200/90 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <WorkNestLogo size="sm" showText={false} />
              <span className="font-bold text-sm tracking-tight text-slate-900">WorkNest</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wider">
              HTTP_STATUS_404_NOT_FOUND
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go back to previous view</span>
            </button>
            <span className="text-slate-200">|</span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[#006370] hover:text-[#004f59] transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>HQ Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center space-y-6 flex-1 flex flex-col justify-center">
        
        <div className="relative flex items-center justify-center select-none">
          <span className="font-extrabold text-[120px] sm:text-[160px] text-slate-100 font-serif leading-none tracking-tight">
            404
          </span>

          <div className="absolute bg-white rounded-2xl border border-slate-200/90 shadow-xl p-4 w-44 space-y-2 transform -rotate-2 hover:rotate-0 transition-transform">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              </div>
              <FileQuestion className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-1 py-1">
              <div className="h-2 bg-slate-100 rounded w-3/4" />
              <div className="h-2 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="pt-1">
              <span className="block text-center py-1 rounded-[6px] bg-rose-50 text-rose-600 font-extrabold text-[10px] tracking-widest border border-rose-200">
                ACCESS DENIED
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Error Code: 404 • Page or Workspace Not Found</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            This room or page has moved or doesn&apos;t exist
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            The URL you are trying to access might have been decommissioned, the booking link has expired, or the space slug is incorrect.
          </p>
        </div>

        <div className="max-w-lg mx-auto w-full pt-2">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active spaces, hubs, or documentation..."
              className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-[10px] text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006370] focus:ring-2 focus:ring-[#006370]/15 shadow-2xs transition-all"
            />
            <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Homepage</span>
          </Link>

          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span>Browse Available Spaces (/spaces)</span>
          </Link>

          <Link
            href="/dashboard/member"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Open Member Dashboard</span>
          </Link>
        </div>

        <div className="pt-10 space-y-3 text-left">
          <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5" />
              <span>RECOMMENDED RECOVERY ROUTES</span>
            </div>
            <span className="font-mono text-[10px]">WorkNest Automated Redirect Node 04</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Link
              href="/spaces"
              className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[8px] bg-cyan-50 text-[#006370] flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#006370] transition-colors" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#006370] transition-colors">
                  Explore Hubs
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Browse 48+ verified workspaces in 14 cities with real-time desk counts.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>NETWORK: LIVE</span>
              </div>
            </Link>

            <Link
              href="/dashboard/member"
              className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                  My Active Bookings
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Check your fast-track QR entrance pass &amp; temporary door access keycodes.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-500">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>AUTH PROTOCOL</span>
              </div>
            </Link>

            <a
              href="https://wa.me/6281234567890?text=Halo,%20halaman%20ruangan%20tidak%20dapat%20ditemukan"
              target="_blank"
              rel="noreferrer"
              className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Frontdesk Help
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Contact local hub site manager directly via WhatsApp or direct line dispatch.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-500">
                <span>AVG RESP: &lt; 2 MIN</span>
              </div>
            </a>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h3 className="font-bold text-xs text-slate-900">
                  Platform Status
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  All IoT smart locks, telemetry &amp; payment systems operational (99.98% uptime).
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] font-bold text-emerald-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>ALL SYSTEMS OK</span>
                </div>
                <span className="text-slate-400 font-normal">v4.18.2</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200/90 py-3 px-4 sm:px-6 lg:px-8 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span>CLIENT_IP: 192.168.1.44</span>
            <span className="text-slate-300">•</span>
            <span>LOCATION: DOWNTOWN_HUB_TOWER_A</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Need manual assistance?</span>
            <a
              href="mailto:support@worknest.id"
              className="font-bold text-[#006370] hover:underline"
            >
              Create Incident Ticket
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
