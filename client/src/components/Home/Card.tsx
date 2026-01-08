"use client";

import { Play, Loader2 } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

interface TemplateCardProps {
  id: number;
  name: string;
  thumbnail?: string | StaticImageData;
  category: string;
  isFeatured?: boolean;
  previewUrl: string;
}

export default function Card({
  id,
  name,
  thumbnail,
  isFeatured = false,
  previewUrl,
}: TemplateCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isHovering, setIsHovering] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);

    if (!isVideoLoaded) {
      setIsVideoLoading(true);
    }

    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsVideoLoading(false);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleLoaded = () => {
    setIsVideoLoaded(true);
    setIsVideoLoading(false);
  };

  return (
    <Link
      href={`/customize/${id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`group h-full rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
          isFeatured
            ? "border-primary/50 bg-linear-to-br from-card to-card/80 shadow-2xl shadow-primary/20 hover:shadow-3xl hover:shadow-primary/30 hover:border-primary"
            : "border-border bg-card hover:border-primary/50 shadow-lg hover:shadow-xl hover:shadow-primary/10"
        }`}
      >
        {/* Media */}
        <div className="relative h-64 overflow-hidden bg-muted">

          {/* Thumbnail */}
          {thumbnail && (
            <Image
              src={thumbnail}
              alt={name}
              fill
              className={`object-cover transition-opacity duration-300 ${
                isHovering && isVideoLoaded ? "opacity-0" : "opacity-100"
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}

          {/* Video */}
          <video
            ref={videoRef}
            src={previewUrl}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              isHovering && isVideoLoaded ? "opacity-100" : "opacity-0"
            }`}
            loop
            muted
            playsInline
            preload="metadata"
            onLoadedData={handleLoaded}
          />

          {/* Loader */}
          {isHovering && isVideoLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-white" /> 
            </div>
          )}

          {/* Play Overlay */}
          {!isHovering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 backdrop-blur-sm transition-transform group-hover:scale-110">
                <Play className="h-5 w-5 fill-primary-foreground text-primary-foreground ml-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`space-y-4 ${isFeatured ? "p-8" : "p-6"}`}>
          <h3
            className={`font-bold transition-colors group-hover:text-primary ${
              isFeatured ? "text-2xl" : "text-lg"
            }`}
          >
            {name}
          </h3>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <span
              className={`font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity ${
                isFeatured ? "text-base" : "text-sm"
              }`}
            >
              Explore →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
