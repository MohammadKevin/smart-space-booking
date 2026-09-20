import { Suspense } from "react";
import { AuthSplitScreen } from "@/components/AuthSplitScreen";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-xs text-slate-500">
          Memuat formulir pendaftaran...
        </div>
      }
    >
      <AuthSplitScreen initialMode="register" />
    </Suspense>
  );
}
