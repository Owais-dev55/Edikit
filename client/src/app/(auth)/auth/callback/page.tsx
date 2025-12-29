"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { refreshUser } from "@/lib/auth";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";
import { LoaderCircle } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get("success");
      const token = searchParams.get("token");

      if (success === "true") {
        // Store token in localStorage immediately if provided (for mobile fallback)
        // Keep it permanently as backup - don't remove it even if cookies appear to work
        // Brave and other mobile browsers may block cookies later, so we need the token as fallback
        if (token) {
          localStorage.setItem("user_token", token);
          console.log(
            "🍪 Token received from OAuth - stored in localStorage as permanent backup"
          );
        }

        // Wait a bit for cookies to be set, then authenticate
        setTimeout(async () => {
          try {
            // Attempt to refresh user - Axios interceptor will use cookies first if available,
            // then fall back to token from localStorage if cookies are blocked
            await refreshUser(dispatch);
            showSuccessToast("Successfully logged in!");
            router.push("/");
          } catch (error) {
            console.error("Failed to get user data:", error);
            showErrorToast("Authentication failed", "Please try again");
            router.push("/login");
          }
        }, token ? 200 : 50); // Longer delay if token exists to allow cookie check
      } else {
        showErrorToast("Authentication failed", "Please try again");
        router.push("/login");
      }
    };

    handleCallback();
  }, [searchParams, dispatch, router]);

  return (
    <div className="min-h-screen dark bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoaderCircle className="animate-spin h-8 w-8 text-primary mx-auto" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen dark bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <LoaderCircle className="animate-spin h-8 w-8 text-primary mx-auto" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
