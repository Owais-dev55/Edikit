"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Download,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { templates } from "@/utils/constant";
import api from "@/lib/auth";
import { showInfoToast, showErrorToast } from "@/components/Toast/showToast";
import Image from "next/image";

interface FormDataState {
  [key: string]: string | File | null;
}

interface RenderJob {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  outputUrl?: string;
  progress?: number;
  error?: string;
}

const CustomizePage = () => {
  const params = useParams();
  const router = useRouter();
  const templateId = parseInt(params.id as string);
  const videoRef = useRef<HTMLVideoElement>(null);

  const template = templates.find((t) => t.id === templateId);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [formData, setFormData] = useState<FormDataState>({});
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({});
  const [uploadedAssets, setUploadedAssets] = useState<{ [key: string]: string }>({});

  // Redirect if template not found
  useEffect(() => {
    if (!template) {
      router.push("/templates");
    }
  }, [template, router]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me", {
          withCredentials: true,
        });
        localStorage.setItem("user", JSON.stringify(data));
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Initialize form data
  useEffect(() => {
    if (template) {
      const initialData: FormDataState = {};
      Object.keys(template.fields).forEach((key) => {
        initialData[key] = "";
      });
      setFormData(initialData);
    }
  }, [template]);

  // Poll job status
  useEffect(() => {
    if (
      !renderJob ||
      renderJob.status === "COMPLETED" ||
      renderJob.status === "FAILED"
    ) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const { data } = await api.get(`/render/job/${renderJob.id}`, {
          withCredentials: true,
        });

        setRenderJob(data);

        if (data.status === "COMPLETED") {
          showInfoToast("Video rendered successfully!");
          clearInterval(pollInterval);
        } else if (data.status === "FAILED") {
          showErrorToast(data.error || "Rendering failed");
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [renderJob]);

  // Cleanup video on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, []);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isVideoPlaying) {
      // Start playing
      if (!isVideoLoaded) {
        setIsVideoLoading(true);
        video.src = template!.previewUrl;
        video.load();
      } else {
        video.play().catch(() => {
          console.error("Play failed");
        });
      }
      setIsVideoPlaying(true);
    } else {
      // Pause video
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
    setIsVideoLoading(false);
    
    if (isVideoPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {
        console.error("Autoplay failed");
      });
    }
  };

  const handleVideoError = () => {
    setIsVideoLoading(false);
    setIsVideoLoaded(false);
    showErrorToast("Failed to load video preview");
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleTextChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleFileUpload = async (fieldKey: string, file: File | null) => {
    if (!file) return;

    setFormData((prev) => ({ ...prev, [fieldKey]: file }));

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews((prev) => ({
          ...prev,
          [fieldKey]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      const videoUrl = URL.createObjectURL(file);
      setFilePreviews((prev) => ({ ...prev, [fieldKey]: videoUrl }));
    }

    await uploadSingleAsset(fieldKey, file);
  };

  const uploadSingleAsset = async (fieldKey: string, file: File) => {
    if (!isLoggedIn) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("files", file);

      const { data } = await api.post("/render/upload-asset", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setUploadedAssets((prev) => ({
        ...prev,
        [fieldKey]: data.urls[0],
      }));

      showInfoToast(`${fieldKey} uploaded successfully`);
    } catch (error) {
      console.error("Upload failed:", error);
      showErrorToast(`Failed to upload ${fieldKey}`);
    }
  };

  const removeFile = (fieldKey: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: null }));
    setFilePreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[fieldKey];
      return newPreviews;
    });
    setUploadedAssets((prev) => {
      const newAssets = { ...prev };
      delete newAssets[fieldKey];
      return newAssets;
    });
  };

  const hasRequiredFields = () => {
    if (!template) return false;
    return Object.entries(template.fields).every(([key, field]) => {
      if (field.required) {
        const value = formData[key];
        return value !== "" && value !== null;
      }
      return true;
    });
  };

  const handleGeneratePreview = async () => {
    if (!isLoggedIn) {
      showInfoToast("Please log in to generate preview");
      router.push("/login");
      return;
    }

    setIsGenerating(true);

    try {
      const renderDto: any = {};

      Object.entries(template!.fields).forEach(([key, field]) => {
        if (field.type === "text") {
          const value = formData[key] as string;
          if (value) {
            renderDto[key] = value;
          }
        } else if (field.type === "image" || field.type === "video") {
          if (uploadedAssets[key]) {
            renderDto[key] = uploadedAssets[key];
          }
        }
      });

      const { data } = await api.post(
        `/render/create-job/${templateId}`,
        renderDto,
        {
          withCredentials: true,
        }
      );

      setRenderJob(data);
      showInfoToast("Render job submitted! Processing...");
    } catch (error: any) {
      console.error("Failed to create render job:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to create render job"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!renderJob?.outputUrl) return;

    try {
      window.open(renderJob.outputUrl, "_blank");
    } catch (error) {
      console.error("Failed to download video:", error);
      showErrorToast("Failed to download video");
    }
  };

  if (!template) {
    return null;
  }

  // Check if we should show rendered video or template preview
  const showRenderedVideo = renderJob?.status === "COMPLETED" && renderJob.outputUrl;

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
          {/* Left Column - Dynamic Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {template.name}
              </h1>
              <p className="text-muted-foreground">{template.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                  {template.category}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card space-y-6">
              {/* Dynamic Fields */}
              {Object.entries(template.fields).map(([fieldKey, field]) => (
                <div key={fieldKey} className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                    {field.dimensions && (
                      <span className="text-xs text-muted-foreground font-normal">
                        ({field.dimensions})
                      </span>
                    )}
                    {uploadedAssets[fieldKey] && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </label>

                  {/* Text Input */}
                  {field.type === "text" && (
                    <div>
                      <input
                        type="text"
                        value={(formData[fieldKey] as string) || ""}
                        onChange={(e) =>
                          handleTextChange(fieldKey, e.target.value)
                        }
                        maxLength={field.maxLength}
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                      {field.maxLength && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {((formData[fieldKey] as string) || "").length} /{" "}
                          {field.maxLength} characters
                        </p>
                      )}
                    </div>
                  )}

                  {/* Image Upload */}
                  {field.type === "image" && (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(e) =>
                          handleFileUpload(
                            fieldKey,
                            e.target.files?.[0] || null
                          )
                        }
                        className="hidden"
                        id={`upload-${fieldKey}`}
                      />

                      {filePreviews[fieldKey] ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <img
                              src={filePreviews[fieldKey]}
                              alt={`${field.label} preview`}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeFile(fieldKey)}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                              type="button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <label
                            htmlFor={`upload-${fieldKey}`}
                            className="text-xs text-center block text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                          >
                            Click to change image
                          </label>
                        </div>
                      ) : (
                        <label
                          htmlFor={`upload-${fieldKey}`}
                          className="cursor-pointer block text-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-2">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            Upload {field.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG (max. 5MB)
                            {field.dimensions && ` • ${field.dimensions}`}
                          </p>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Video Upload */}
                  {field.type === "video" && (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        onChange={(e) =>
                          handleFileUpload(
                            fieldKey,
                            e.target.files?.[0] || null
                          )
                        }
                        className="hidden"
                        id={`upload-${fieldKey}`}
                      />

                      {filePreviews[fieldKey] ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <video
                              src={filePreviews[fieldKey]}
                              className="w-full h-40 object-cover rounded-lg"
                              controls
                            />
                            <button
                              onClick={() => removeFile(fieldKey)}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                              type="button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <label
                            htmlFor={`upload-${fieldKey}`}
                            className="text-xs text-center block text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                          >
                            Click to change video
                          </label>
                        </div>
                      ) : (
                        <label
                          htmlFor={`upload-${fieldKey}`}
                          className="cursor-pointer block text-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-2">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            Upload {field.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            MP4 (max. 50MB)
                            {field.dimensions && ` • ${field.dimensions}`}
                          </p>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Dimension Disclaimer */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 <strong>Note:</strong> Empty fields will keep the
                  template&apos;s default appearance. Files are uploaded
                  automatically when selected.
                </p>
              </div>
            </div>

            {/* Render Status */}
            {renderJob && (
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div className="flex items-center gap-3">
                  {renderJob.status === "PENDING" && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">Job Submitted</p>
                        <p className="text-sm text-muted-foreground">
                          Waiting in queue...
                        </p>
                      </div>
                    </>
                  )}
                  {renderJob.status === "PROCESSING" && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Rendering</p>
                        <p className="text-sm text-muted-foreground">
                          {renderJob.progress !== undefined
                            ? `${renderJob.progress}% complete`
                            : "Processing your video..."}
                        </p>
                      </div>
                    </>
                  )}
                  {renderJob.status === "COMPLETED" && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">Completed!</p>
                        <p className="text-sm text-muted-foreground">
                          Your video is ready
                        </p>
                      </div>
                    </>
                  )}
                  {renderJob.status === "FAILED" && (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium">Failed</p>
                        <p className="text-sm text-muted-foreground">
                          {renderJob.error || "Something went wrong"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {renderJob.status === "PROCESSING" &&
                  renderJob.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-500 ease-out"
                          style={{ width: `${renderJob.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-right text-muted-foreground">
                        {renderJob.progress}%
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Generate Button */}
            {authLoading ? (
              <div className="w-full h-12 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
            ) : (
              <button
                onClick={handleGeneratePreview}
                disabled={
                  isGenerating ||
                  authLoading ||
                  !hasRequiredFields() ||
                  renderJob?.status === "PENDING" ||
                  renderJob?.status === "PROCESSING"
                }
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Job...
                  </>
                ) : isLoggedIn ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Render Video
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Login to Render
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Preview
                </h2>

                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative border border-border">
                  {showRenderedVideo ? (
                    // Show rendered video with controls
                    <video
                      src={renderJob.outputUrl}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      loop
                    />
                  ) : (
                    // Show interactive template preview
                    <>
                      {/* Static Thumbnail - shown when video not playing */}
                      {!isVideoPlaying && !imageError && template.thumbnail && (
                        <Image
                          src={template.thumbnail}
                          alt={template.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          onError={() => setImageError(true)}
                          priority={false}
                        />
                      )}

                      {/* Fallback if image fails or no thumbnail */}
                      {(imageError || !template.thumbnail) && !isVideoPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          <p className="text-sm text-muted-foreground">No preview</p>
                        </div>
                      )}

                      {/* Video (lazy loaded on first click) */}
                      <video
                        ref={videoRef}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          isVideoPlaying && isVideoLoaded ? "opacity-100" : "opacity-0"
                        }`}
                        onLoadedData={handleVideoLoaded}
                        onError={handleVideoError}
                        onEnded={handleVideoEnded}
                      />

                      {/* Play/Pause Overlay */}
                      <div 
                        className="absolute inset-0 cursor-pointer"
                        onClick={handleVideoClick}
                      >
                        {!isVideoPlaying && !isVideoLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 backdrop-blur-sm transition-transform hover:scale-110">
                              <Play className="h-8 w-8 fill-primary-foreground text-primary-foreground ml-1" />
                            </div>
                          </div>
                        )}

                        {/* Loading indicator while video loads */}
                        {isVideoLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                            <Loader2 className="h-12 w-12 animate-spin text-white" />
                          </div>
                        )}

                        {/* Subtle pause indicator when playing */}
                        {isVideoPlaying && isVideoLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                              <div className="flex gap-1">
                                <div className="w-1.5 h-5 bg-white rounded-full" />
                                <div className="w-1.5 h-5 bg-white rounded-full" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Click hint */}
                      {!isVideoPlaying && !isVideoLoading && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                          <p className="text-xs text-white font-medium">
                            Click to preview
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {showRenderedVideo && (
                  <button
                    onClick={handleDownload}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Video
                  </button>
                )}
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
                    Remove watermark
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Transparent backgrounds
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
