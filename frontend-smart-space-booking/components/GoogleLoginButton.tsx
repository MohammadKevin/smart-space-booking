"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { googleAuth, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface GoogleLoginButtonProps {
  label?: string;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

export function GoogleLoginButton({
  label = "Lanjutkan dengan Google",
  onError,
  onSuccess,
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { loginUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "105437890123-google-client-id-smart-space.apps.googleusercontent.com";

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    try {
      const token = response.credential;
      if (!token) {
        throw new Error("Token autentikasi Google tidak ditemukan.");
      }

      // Decode payload client-side for immediate name/avatar fallback
      let name: string | undefined;
      let email: string | undefined;
      let avatar: string | undefined;

      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const parsed = JSON.parse(jsonPayload);
        name = parsed.name;
        email = parsed.email;
        avatar = parsed.picture;
      } catch {}

      const authRes = await googleAuth({
        token,
        name,
        email,
        avatar,
      });

      loginUser(authRes.access_token, authRes.user);
      if (onSuccess) onSuccess();

      const role = authRes.user.role?.toLowerCase();
      const defaultDashboard =
        role === "admin_space" || role === "owner"
          ? "/dashboard/owner"
          : role === "staff"
          ? "/dashboard/staff"
          : "/dashboard/member";

      setTimeout(() => {
        if (redirectParam) {
          router.push(redirectParam);
        } else {
          router.push(defaultDashboard);
        }
      }, 400);
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPopup = () => {
    if (typeof window === "undefined") return;

    const google = (window as any).google;
    if (google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is blocked or not displayed, open Google OAuth popup
          initiateOAuthRedirect();
        }
      });
    } else {
      initiateOAuthRedirect();
    }
  };

  const initiateOAuthRedirect = () => {
    // Standard Google OAuth 2.0 Auth URL for web client
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      googleClientId
    )}&redirect_uri=${encodeURIComponent(
      window.location.origin + "/login"
    )}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=smartspace_${Date.now()}`;

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2.5;

    const popup = window.open(
      oauthUrl,
      "google_oauth_popup",
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    // Monitor popup hash for response
    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(interval);
          setLoading(false);
          return;
        }

        if (popup.location.href.includes("access_token=") || popup.location.href.includes("id_token=")) {
          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const idToken = params.get("id_token");
          const accessToken = params.get("access_token");
          popup.close();
          clearInterval(interval);

          if (idToken || accessToken) {
            handleGoogleCredentialResponse({ credential: idToken || accessToken });
          }
        }
      } catch {
        // Cross-origin access error while popup is on google.com is expected until redirect
      }
    }, 500);
  };

  return (
    <button
      type="button"
      onClick={handleManualPopup}
      disabled={loading}
      className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 hover:border-slate-400 shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
      ) : (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}
