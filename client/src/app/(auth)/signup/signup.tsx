"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, LoaderCircle, Check, X } from "lucide-react";
import Image from "next/image";
import { GoogleIcon } from "@/components/Overlay/Svg";
import { signupUser, handleGoogleLogin, appleLogin } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { z } from "zod";

// Zod Schema for Signup Form
const signupSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

type SignupFormData = z.infer<typeof signupSchema>;

// Password validation criteria
const passwordCriteria = [
  { label: "At least 8 characters", test: (pwd: string) => pwd.length >= 8 },
  { label: "One uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
  { label: "One lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
  { label: "One number", test: (pwd: string) => /[0-9]/.test(pwd) },
];

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignupFormData, boolean>>>({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // Clear error when user starts typing
  const handleFieldChange = (field: keyof SignupFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setTouched({ ...touched, [field]: true });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Mark all fields as touched
    setTouched({ fullName: true, email: true, password: true });

    // Validate with Zod
    const validation = signupSchema.safeParse(formData);

    if (!validation.success) {
      // Extract errors from Zod
      const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof SignupFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

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
              <div className="w-40 h-12 rounded-lg flex items-center justify-center mx-auto">
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
                    onChange={(e) => handleFieldChange("fullName", e.target.value)}
                    className={`w-full h-10 pl-10 pr-3 rounded-lg border ${
                      errors.fullName ? "border-red-500" : "border-border"
                    } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                      errors.fullName ? "focus:ring-red-500" : "focus:ring-ring"
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-500">{errors.fullName}</p>
                )}
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
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className={`w-full h-10 pl-10 pr-3 rounded-lg border ${
                      errors.email ? "border-red-500" : "border-border"
                    } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                      errors.email ? "focus:ring-red-500" : "focus:ring-ring"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
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
                    onChange={(e) => handleFieldChange("password", e.target.value)}
                    className={`w-full h-10 pl-10 pr-3 rounded-lg border ${
                      errors.password ? "border-red-500" : "border-border"
                    } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                      errors.password ? "focus:ring-red-500" : "focus:ring-ring"
                    }`}
                  />
                </div>
                
                {/* Password Requirements */}
                <div className="space-y-1 mt-2">
                  {passwordCriteria.map((criterion, index) => {
                    const isValid = criterion.test(formData.password);
                    const showCheck = formData.password.length > 0;
                    
                    return (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        {showCheck ? (
                          isValid ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-muted-foreground" />
                        )}
                        <span className={showCheck && isValid ? "text-green-500" : "text-muted-foreground"}>
                          {criterion.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {errors.password && (
                  <p className="text-xs text-red-500 mt-2">{errors.password}</p>
                )}
              </div>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  By creating an account, you agree to our{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
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