import { Suspense } from "react";
import { AuthSplitScreen } from "@/components/AuthSplitScreen";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-xs text-slate-500">
          Memuat halaman login...
        </div>
      }
    >
      <AuthSplitScreen initialMode="login" />
    </Suspense>
  );
}
