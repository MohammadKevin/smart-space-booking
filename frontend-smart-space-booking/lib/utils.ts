/**
 * Shared utility functions for WorkNest Smart Space Booking (Fixes BUG-021)
 */

export function formatRupiah(amount: number | string | undefined | null): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || 0)) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}
