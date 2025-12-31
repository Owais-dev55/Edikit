"use client";
import React, { useState } from "react";
import { Mail, Lock, LoaderCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AppleIcon, GoogleIcon } from "@/components/Overlay/Svg";
import { loginUser, appleLogin } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";

import { handleGoogleLogin } from "@/lib/auth";
const Login = () => {
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginUser(
        formData.email,
        formData.password,
        dispatch
      );
      console.log("Login successful:", response);
      router.push("/");
      showSuccessToast("Logged in successfully!");
    } catch (error: any) {
      showErrorToast("Login failed", error.response?.data?.message);
      setError(error.response?.data?.message || "Login failed");
      setLoading(false);
    } finally {
      setLoading(false);
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
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Log in to your Edikit account
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  {/* <Link
                    href="#"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link> */}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 cursor-pointer rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    Signing In...
                    <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" />
                  </div>
                ) : (
                  "Sign In"
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

            {/* Social Login */}
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

            {/* Sign Up Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
