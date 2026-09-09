"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createSpace,
  SpaceType,
  getApiErrorMessage,
} from "@/lib/api";
import {
  Building,
  Users,
  Maximize2,
  UploadCloud,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Wifi,
  Tv,
  Mic,
  Volume2,
  Coffee,
  Sun,
  Shield,
  Radio,
  Key,
  ArrowRight,
  Save,
  Trash2,
  Loader2,
  Zap,
  Layers,
} from "lucide-react";

interface AmenityOption {
  id: string;
  name: string;
  desc: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AMENITY_OPTIONS: AmenityOption[] = [
  {
    id: "display_4k",
    name: "4K UHD Presentation Display",
    desc: '65" Sony Bravia HDR with HDMI & AirPlay',
    tag: "4K Display",
    icon: Tv,
  },
  {
    id: "polycom_bar",
    name: "Polycom / Jabra Video Bar",
    desc: "Auto speaker-tracking with beamforming mic",
    tag: "Polycom Video",
    icon: Mic,
  },
  {
    id: "glass_board",
    name: "Ultra-wide Magnetic Glass Board",
    desc: "3.2m x 1.2m seamless tempered glass surface",
    tag: "Glass Board",
    icon: Sparkles,
  },
  {
    id: "wifi_fiber",
    name: "Dual Gigabit Symmetrical Fiber",
    desc: "Wi-Fi 6E mesh with dedicated VLAN per session",
    tag: "Wi-Fi 6E",
    icon: Wifi,
  },
  {
    id: "acoustic_panels",
    name: "Dedicated Soundproof Paneling",
    desc: "Certified -42dB acoustic isolation damping",
    tag: "Acoustic -42dB",
    icon: Volume2,
  },
  {
    id: "nespresso_bar",
    name: "Complimentary Nespresso Bar",
    desc: "Artisanal pods and filtered chilled water tap",
    tag: "Nespresso Bar",
    icon: Coffee,
  },
  {
    id: "podcast_mics",
    name: "Podcast Microphones & Mixer",
    desc: "Rodecaster Pro II console with 4x Shure SM7B",
    tag: "Podcast Gear",
    icon: Mic,
  },
  {
    id: "balcony_access",
    name: "Natural Sunlight / Balcony Access",
    desc: "Floor-to-ceiling double glazed patio door",
    tag: "Balcony Access",
    icon: Sun,
  },
];

const PRESET_SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
];

export default function CreateWorkspacePage() {
  const router = useRouter();

  const [title, setTitle] = useState("Semeru Creative Studio & Podcast Suite");
  const [category, setCategory] = useState("Meeting Room & Production");
  const [spaceType, setSpaceType] = useState<SpaceType>("meeting_room");
  const [floorUnit, setFloorUnit] = useState("Lantai 3, Unit 304");
  const [capacity, setCapacity] = useState(8);
  const [floorArea, setFloorArea] = useState(36);

  const [photos, setPhotos] = useState<string[]>(PRESET_SAMPLE_PHOTOS);
  const [coverIndex, setCoverIndex] = useState(0);
  const [customPhotoInput, setCustomPhotoInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [hourlyRate, setHourlyRate] = useState(150000);
  const [fullDayRate, setFullDayRate] = useState(1050000);
  const [minDuration, setMinDuration] = useState("1 Jam Minimal");
  const [turnoverBuffer, setTurnoverBuffer] = useState("15 Menit buffer antar reservasi");

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "display_4k",
    "polycom_bar",
    "glass_board",
    "wifi_fiber",
    "acoustic_panels",
    "nespresso_bar",
  ]);

  const [relayType, setRelayType] = useState("Zigbee 3.0 Door Strike / Magnetic Lock");
  const [hardwareNodeId, setHardwareNodeId] = useState("ESP32-RELAY-MLG-304 (Online • Ping 14ms)");
  const [autoDynamicPin, setAutoDynamicPin] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pulseState, setPulseState] = useState<"idle" | "pulsing" | "success">("idle");

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCategory(val);
    if (val.includes("Desk") || val.includes("Solo")) {
      setSpaceType("desk");
    } else if (val.includes("Suite") || val.includes("Private Office")) {
      setSpaceType("private_office");
    } else {
      setSpaceType("meeting_room");
    }
  };

  const handleAddPhoto = () => {
    if (customPhotoInput.trim() && photos.length < 8) {
      setPhotos([...photos, customPhotoInput.trim()]);
      setCustomPhotoInput("");
      setShowUrlInput(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64 && photos.length < 8) {
        setPhotos([...photos, base64]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    if (coverIndex >= updated.length) {
      setCoverIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleSendTestPulse = () => {
    setPulseState("pulsing");
    setTimeout(() => {
      setPulseState("success");
      setTimeout(() => setPulseState("idle"), 3000);
    }, 600);
  };

  const auditDetailsPass = Boolean(title.trim() && floorUnit.trim() && capacity > 0 && floorArea > 0);
  const auditPricingPass = Boolean(hourlyRate > 0);
  const auditPhotosPass = Boolean(photos.length >= 1);
  const auditReadyToPublish = auditDetailsPass && auditPricingPass && auditPhotosPass;

  const passedCount =
    (auditDetailsPass ? 1 : 0) +
    (auditPricingPass ? 1 : 0) +
    (auditPhotosPass ? 1 : 0) +
    (auditReadyToPublish ? 1 : 0);

  const handleSubmitPublish = async () => {
    if (!title.trim()) {
      setErrorMsg("Nama ruangan tidak boleh kosong.");
      return;
    }
    if (hourlyRate <= 0) {
      setErrorMsg("Harga per jam harus lebih dari Rp 0.");
      return;
    }
    if (capacity <= 0) {
      setErrorMsg("Kapasitas minimal 1 pax.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const activeTags = AMENITY_OPTIONS.filter((a) => selectedAmenities.includes(a.id))
        .map((a) => a.name)
        .join(", ");

      const fullDescription = [
        `Lokasi: ${floorUnit} | Luas: ${floorArea} SQM`,
        `Kategori: ${category}`,
        `Durasi Minimum: ${minDuration} | Buffer Pembersihan: ${turnoverBuffer}`,
        `Fasilitas: ${activeTags}`,
        `IoT Controller: ${relayType} (Node: ${hardwareNodeId})`,
      ].join("\n");

      const coverPhoto = photos[coverIndex] || photos[0] || "";

      await createSpace({
        namaSpace: title.trim(),
        tipe: spaceType,
        hargaPerJam: Number(hourlyRate),
        kapasitas: Number(capacity),
        foto: coverPhoto,
        deskripsi: fullDescription,
      });

      setSuccessMsg("Unit ruangan berhasil dipublikasikan ke katalog!");
      setTimeout(() => {
        router.push("/dashboard/owner/spaces");
      }, 1200);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>WORKSPACE OWNER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Pendaftaran Unit Baru
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Tambah Ruangan Kerja Baru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Konfigurasikan spesifikasi ruangan, skema tarif per jam, fasilitas, dan integrasi perangkat IoT smart lock.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/dashboard/owner/spaces"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors"
          >
            Batal
          </Link>
          <button
            type="button"
            onClick={handleSubmitPublish}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-bold rounded-xs shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mempublikasikan...</span>
              </>
            ) : (
              <>
                <span>Publikasikan Ruangan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs font-medium shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xs text-xs font-medium shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-serif text-base font-bold text-slate-900">
                  01 / Identitas &amp; Dimensi Ruangan
                </h2>
                <p className="text-xs text-slate-500">
                  Nama unit publik, kategori ruangan, lantai gedung, dan daya tampung.
                </p>
              </div>
              <Building className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Ruangan Resmi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={90}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Semeru Creative Studio & Podcast Suite"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs outline-none transition-colors text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kategori Ruangan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs outline-none transition-colors text-slate-900 cursor-pointer"
                  >
                    <option value="Meeting Room & Production">Meeting Room &amp; Production</option>
                    <option value="Executive VIP Suite">Executive VIP Suite</option>
                    <option value="Focus Pod & Solo Booth">Focus Pod &amp; Solo Booth</option>
                    <option value="Team Sprint Lab">Team Sprint Lab</option>
                    <option value="Event Space & Workshop Loft">Event Space &amp; Workshop Loft</option>
                    <option value="Open Hot Desk Commons">Open Hot Desk Commons</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lantai &amp; Nomor Unit <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={floorUnit}
                      onChange={(e) => setFloorUnit(e.target.value)}
                      placeholder="Lantai 3, Unit 304"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs outline-none transition-colors text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kapasitas Maksimal <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full pl-9 pr-14 py-2.5 text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs outline-none transition-colors text-slate-900"
                    />
                    <span className="absolute right-3.5 top-2.5 text-[11px] font-mono font-bold text-slate-400">
                      PAX
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Luas Ruangan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={floorArea}
                      onChange={(e) => setFloorArea(Number(e.target.value))}
                      className="w-full pl-9 pr-14 py-2.5 text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs outline-none transition-colors text-slate-900"
                    />
                    <span className="absolute right-3.5 top-2.5 text-[11px] font-mono font-bold text-slate-400">
                      SQM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-serif text-base font-bold text-slate-900">
                  02 / Galeri Foto Ruangan
                </h2>
                <p className="text-xs text-slate-500">
                  Foto display resolusi tinggi untuk katalog publik calon member.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-xs bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
                {photos.length} / 8 Foto
              </span>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-[#006370]/50 rounded-xs p-6 text-center transition-colors bg-slate-50/40">
              <input
                type="file"
                id="photo-upload-input"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="photo-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center mb-2.5 border border-[#BCE3DE]">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  <span className="text-[#006370] underline underline-offset-2">Pilih file foto</span> atau unggah gambar ruangan
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format JPG, PNG atau WebP (Rekomendasi minimal 1920x1080px)
                </p>
              </label>

              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] text-[#006370] hover:underline font-semibold cursor-pointer"
                >
                  {showUrlInput ? "Tutup input URL" : "+ Tambah via Image URL"}
                </button>
              </div>

              {showUrlInput && (
                <div className="mt-3 flex items-center gap-2 max-w-md mx-auto">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customPhotoInput}
                    onChange={(e) => setCustomPhotoInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xs bg-white outline-none focus:border-[#006370]"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-3 py-1.5 bg-[#006370] text-white text-xs font-bold rounded-xs cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
              )}
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className={`group relative aspect-4/3 rounded-xs overflow-hidden border-2 transition-all ${
                      coverIndex === idx
                        ? "border-[#006370] ring-1 ring-[#006370]/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Workspace photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {coverIndex === idx && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#006370] text-white text-[9px] font-mono font-bold rounded-xs shadow-xs">
                        UTAMA
                      </span>
                    )}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                      {coverIndex !== idx && (
                        <button
                          type="button"
                          onClick={() => setCoverIndex(idx)}
                          className="px-2 py-1 bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold rounded-xs cursor-pointer"
                        >
                          Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xs cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-serif text-base font-bold text-slate-900">
                  03 / Konfigurasi Tarif &amp; Pemesanan
                </h2>
                <p className="text-xs text-slate-500">
                  Penetapan harga per jam, paket sewa harian, dan buffer pembersihan.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-xs bg-[#E6F4F2] border border-[#BCE3DE] text-[10px] font-mono font-bold text-[#006370]">
                MATA UANG: IDR
              </span>
            </div>

            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tarif Sewa Standar Per Jam <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-slate-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      step={5000}
                      min={0}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full pl-10 pr-12 py-2.5 text-xs font-bold bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs outline-none transition-colors text-slate-900 font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-[11px] font-medium text-slate-400">
                      / jam
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Paket Sewa Harian (Full Day 8 Jam)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-slate-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      step={10000}
                      min={0}
                      value={fullDayRate}
                      onChange={(e) => setFullDayRate(Number(e.target.value))}
                      className="w-full pl-10 pr-12 py-2.5 text-xs font-bold bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs outline-none transition-colors text-slate-900 font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-[11px] font-medium text-slate-400">
                      / hari
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Durasi Minimal Reservasi
                  </label>
                  <select
                    value={minDuration}
                    onChange={(e) => setMinDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs outline-none transition-colors text-slate-900 cursor-pointer"
                  >
                    <option value="1 Jam Minimal">1 Jam Minimal</option>
                    <option value="2 Jam Minimal">2 Jam Minimal</option>
                    <option value="Setengah Hari (4 Jam)">Setengah Hari (4 Jam)</option>
                    <option value="Satu Hari Penuh (8 Jam)">Satu Hari Penuh (8 Jam)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Buffer Waktu Pembersihan / Turnover
                  </label>
                  <select
                    value={turnoverBuffer}
                    onChange={(e) => setTurnoverBuffer(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#006370] rounded-xs outline-none transition-colors text-slate-900 cursor-pointer"
                  >
                    <option value="15 Menit buffer antar reservasi">15 Menit buffer antar reservasi</option>
                    <option value="30 Menit buffer antar reservasi">30 Menit buffer antar reservasi</option>
                    <option value="45 Menit buffer antar reservasi">45 Menit buffer antar reservasi</option>
                    <option value="Tanpa buffer pembersihan">Tanpa buffer pembersihan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-serif text-base font-bold text-slate-900">
                  04 / Fasilitas &amp; Perlengkapan
                </h2>
                <p className="text-xs text-slate-500">
                  Pilih fasilitas resmi yang tersedia di ruangan ini.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-xs bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
                {selectedAmenities.length} Terpilih
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {AMENITY_OPTIONS.map((item) => {
                const checked = selectedAmenities.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAmenity(item.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xs border text-left transition-all cursor-pointer ${
                      checked
                        ? "bg-[#E6F4F2]/50 border-[#006370] shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 mt-0.5 rounded-xs border flex items-center justify-center transition-colors shrink-0 ${
                        checked
                          ? "bg-[#006370] border-[#006370] text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-snug">{item.name}</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200 rounded-xs p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                PREVIEW KATALOG
              </span>
              <span className="px-2 py-0.5 rounded-xs bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
                Siap Publikasi
              </span>
            </div>

            <div className="border border-slate-200 rounded-xs overflow-hidden bg-white shadow-2xs">
              <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                <img
                  src={photos[coverIndex] || photos[0] || PRESET_SAMPLE_PHOTOS[0]}
                  alt="Catalog Preview"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-xs bg-[#006370] text-white text-[10px] font-bold shadow-2xs font-mono">
                  Instant Book
                </span>
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-xs bg-slate-900/80 text-white text-[10px] font-mono backdrop-blur-xs">
                  {floorUnit || "Lantai 3 • Unit 304"}
                </span>
              </div>

              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-600">{category}</span>
                  <span className="font-bold text-amber-600">★ Baru</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {title || "Ruangan Kerja"}
                </h3>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedAmenities.slice(0, 3).map((id) => {
                    const found = AMENITY_OPTIONS.find((a) => a.id === id);
                    if (!found) return null;
                    return (
                      <span
                        key={id}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-xs border border-slate-200"
                      >
                        {found.tag}
                      </span>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                      Rp {Number(hourlyRate).toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] text-slate-400"> / jam</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{capacity} Pax</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xs p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                VERIFIKASI KELENGKAPAN
              </span>
              <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                {passedCount} / 4 Lolos
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#006370] transition-all duration-300"
                style={{ width: `${(passedCount / 4) * 100}%` }}
              />
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-xs flex items-center justify-center ${
                    auditDetailsPass
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Identitas &amp; dimensi unit terisi</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-xs flex items-center justify-center ${
                    auditPricingPass
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Tarif sewa per jam valid</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-xs flex items-center justify-center ${
                    auditPhotosPass
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Minimal 1 foto ruangan aktif</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
