"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadVideo } from "@/lib/videoDownload";
import { showInfoToast, showErrorToast } from "@/components/Toast/showToast";

interface VideoDownloadButtonProps {
  videoUrl: string;
  filename?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export default function VideoDownloadButton({
  videoUrl,
  filename,
  variant = "primary",
  size = "md",
  className = "",
  showLabel = true,
}: VideoDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      await downloadVideo(videoUrl, {
        filename,
        onProgress: (progress) => setDownloadProgress(progress),
        onSuccess: () => {
          showInfoToast("Video downloaded successfully!");
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    } catch (error) {
      console.error("Download failed:", error);
      showErrorToast("Failed to download video");
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    }
  };

  // Button size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  // Button variant styles
  const variantStyles = {
    primary:
      "bg-linear-to-r from-primary to-primary/90 text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    outline:
      "border border-border text-foreground hover:bg-accent",
  };

  const iconSize = size === "sm" ? 4 : size === "lg" ? 5 : 4;

  return (
    <div className="space-y-3">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      >
        {isDownloading ? (
          <>
            <Loader2 className={`w-${iconSize} h-${iconSize} animate-spin`} />
            {showLabel && `Downloading... ${downloadProgress}%`}
          </>
        ) : (
          <>
            <Download className={`w-${iconSize} h-${iconSize}`} />
            {showLabel && "Download Video"}
          </>
        )}
      </button>

      {isDownloading && downloadProgress > 0 && (
        <div className="space-y-1">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {downloadProgress}% downloaded
          </p>
        </div>
      )}
    </div>
  );
}
