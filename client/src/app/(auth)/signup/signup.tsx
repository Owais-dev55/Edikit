"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { AppleIcon, GoogleIcon } from "@/components/Overlay/Svg";
import { signupUser, handleGoogleLogin, appleLogin } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await signupUser(
        formData.fullName,
        formData.email,
        formData.password,
        dispatch
      );
      console.log(response);
      showSuccessToast("Signup successful", "Your account has been created.");
      router.push("/");
      console.log("Signup successful:", response);
    } catch (error: any) {
      setLoading(false);
      showErrorToast("Signup failed", error.response?.data?.message);
      console.error("Signup failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="p-8 rounded-lg border border-border bg-card">
            {/* Header */}
            <div className="text-center space-y-3 mb-8">
              <div className="w-40 h-12  rounded-lg flex items-center justify-center mx-auto">
                <Image src="/Logo png.png" alt="Logo" width={160} height={50} />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground">
                Start creating stunning motion graphics today
              </p>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                >
                  I agree to the{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    Creating Account...
                    <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" />
                  </div>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Sign Up */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors"
              >
                <GoogleIcon size={20} />
                Continue with Google
              </button>

              <button
                onClick={() => appleLogin(dispatch)}
                type="button"
                className="w-full cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors"
              >
                <AppleIcon />
                Continue with Apple
              </button>
            </div>

            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
