"use client";
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Download,
  Play,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Loader from "@/components/Overlay/Loader";
import api from "@/lib/auth";

const templateData: Record<string, any> = {
  "1": {
    title: "Product Launch",
    category: "Marketing",
    duration: "15s",
    thumbnail: "/modern-product-launch-animation-dark-background.jpg",
  },
  "2": {
    title: "Social Media Promo",
    category: "Social",
    duration: "10s",
    thumbnail: "/social-media-promotional-video-template-vibrant.jpg",
  },
  "3": {
    title: "Logo Reveal",
    category: "Branding",
    duration: "8s",
    thumbnail: "/elegant-logo-reveal-animation.jpg",
  },
};

const CustomizePage = () => {
  
  const params = useParams();
  const templateId = params.id as string;
  const template = templateData[templateId] || templateData["1"];
  const [user, setUser] = useState(null);
  const [loading , setLoading] = useState(true);

  const [formData, setFormData] = useState({
    headline: "Your Product Name",
    subheadline: "Launching Soon",
    description: "Get ready for something amazing",
    primaryColor: "#8b5cf6",
    secondaryColor: "#6366f1",
    logo: null as File | null,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedVideo(
        "/placeholder.svg?height=480&width=854&text=Generated+Video+Preview"
      );
      setIsGenerating(false);
    }, 3000);
  };

  const router = useRouter();

useEffect(() => {
  const checkAuth = async () => {
    try {
      const { data } = await api.get("/auth/me", {
        withCredentials: true,
      });

      localStorage.setItem("user", JSON.stringify(data));
      setLoading(false);
    } catch (error) {
      console.log("Not authenticated");
      router.replace("/login");
    }
  };

  checkAuth();
}, []);

  if(loading) {
    return (
      <div className=" h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Customization Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {template.title}
              </h1>
              <p className="text-muted-foreground">
                Customize your video template
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card space-y-6">
              {/* Text Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="headline"
                    className="text-sm font-medium text-foreground"
                  >
                    Headline
                  </label>
                  <input
                    id="headline"
                    type="text"
                    value={formData.headline}
                    onChange={(e) =>
                      setFormData({ ...formData, headline: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter main headline"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="subheadline"
                    className="text-sm font-medium text-foreground"
                  >
                    Subheadline
                  </label>
                  <input
                    id="subheadline"
                    type="text"
                    value={formData.subheadline}
                    onChange={(e) =>
                      setFormData({ ...formData, subheadline: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter subheadline"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-foreground"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Logo
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    {logoPreview ? (
                      <div className="space-y-3">
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="Logo preview"
                          className="w-24 h-24 mx-auto object-contain"
                        />
                        <p className="text-sm text-muted-foreground">
                          Click to change logo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Upload your logo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG or SVG (max. 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="primaryColor"
                    className="text-sm font-medium text-foreground"
                  >
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-16 h-10 p-1 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryColor: e.target.value,
                        })
                      }
                      className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="secondaryColor"
                    className="text-sm font-medium text-foreground"
                  >
                    Secondary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondaryColor: e.target.value,
                        })
                      }
                      className="w-16 h-10 p-1 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondaryColor: e.target.value,
                        })
                      }
                      className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleGeneratePreview}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Preview...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Preview
                </>
              )}
            </button>
          </div>

          {/* Right Column - Video Preview */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Preview
                </h2>

                {/* Video Player */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative border border-border">
                  {generatedVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-muted to-background">
                      <div className="text-center space-y-4">
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${formData.primaryColor}33, ${formData.secondaryColor}33)`,
                          }}
                        >
                          <div className="space-y-6 p-8">
                            {logoPreview && (
                              <img
                                src={logoPreview || "/placeholder.svg"}
                                alt="Logo"
                                className="w-20 h-20 mx-auto object-contain"
                              />
                            )}
                            <div className="space-y-2">
                              <h3
                                className="text-2xl font-bold"
                                style={{ color: formData.primaryColor }}
                              >
                                {formData.headline}
                              </h3>
                              <p
                                className="text-lg"
                                style={{ color: formData.secondaryColor }}
                              >
                                {formData.subheadline}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formData.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center border-2 border-border">
                          <Play className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            No preview yet
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Generate a preview to see your video
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {generatedVideo && (
                  <div className="flex gap-3">
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-transparent text-foreground font-medium hover:bg-accent transition-colors">
                      <Play className="w-4 h-4" />
                      Play
                    </button>
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-transparent text-foreground font-medium hover:bg-accent transition-colors">
                      <Download className="w-4 h-4" />
                      Download HD
                    </button>
                  </div>
                )}

                {/* Template Info */}
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-foreground font-medium">
                      {template.duration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Resolution</span>
                    <span className="text-foreground font-medium">
                      1920 × 1080
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Format</span>
                    <span className="text-foreground font-medium">
                      MP4, MOV
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="p-6 rounded-lg bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Unlock Premium Features
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    4K resolution exports
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    .mov format support
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    with transparent backgrounds
                  </li>
                </ul>
                <Link
                  href="/pricing"
                  className="block w-full text-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomizePage;
