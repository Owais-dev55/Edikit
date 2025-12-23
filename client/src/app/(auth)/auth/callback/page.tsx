"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { refreshUser } from "@/lib/auth";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";
import { LoaderCircle } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get("success");

      if (success === "true") {
        try {
          await refreshUser(dispatch);
          showSuccessToast("Successfully logged in!");
          router.push("/");
        } catch (error) {
          console.error("Failed to get user data:", error);

          showErrorToast("Authentication failed", "Please try again");
          router.push("/login");
        }
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
