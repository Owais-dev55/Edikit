'use client';
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Play, Loader2 } from "lucide-react";
import Image from "next/image";

interface TemplateCardProps {
  id: number;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  previewUrl: string;
}

const TemplateCard = ({
  id,
  name,
  description,
  category,
  thumbnail,
  previewUrl,
}: TemplateCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Cleanup video on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
    
    const video = videoRef.current;
    if (!video) return;

    // If video hasn't been loaded yet, load it
    if (!hasLoadedOnce) {
      setIsVideoLoading(true);
      video.src = previewUrl;
      video.load();
      setHasLoadedOnce(true);
    } else if (isVideoLoaded) {
      // Video already loaded, just play it
      video.play().catch(() => {
        // Handle autoplay errors silently
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
    setIsVideoLoading(false);
    
    // Auto-play if still hovering
    if (isHovering && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Handle autoplay errors
      });
    }
  };

  const handleVideoError = () => {
    setIsVideoLoading(false);
    setIsVideoLoaded(false);
  };

  return (
    <Link 
      href={`/customize/${id}`}
      className="group block"
    >
      <div
        className="relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Preview Container - Fixed Height */}
        <div className="relative h-64 overflow-hidden bg-muted">
          {/* Static Thumbnail */}
          {!isHovering && !imageError && (
            <Image
              src={thumbnail}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
              priority={false}
            />
          )}

          {/* Fallback if image fails */}
          {imageError && !isHovering && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <p className="text-sm text-muted-foreground">No preview</p>
            </div>
          )}

          {/* Video (lazy loaded on first hover) */}
          <video
            ref={videoRef}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              isHovering && isVideoLoaded ? "opacity-100" : "opacity-0"
            }`}
            loop
            muted
            playsInline
            preload="none"
            onLoadedData={handleVideoLoaded}
            onError={handleVideoError}
          />

          {/* Play Icon Overlay */}
          {!isHovering && !isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 backdrop-blur-sm transition-transform group-hover:scale-110">
                <Play className="h-5 w-5 fill-primary-foreground text-primary-foreground ml-0.5" />
              </div>
            </div>
          )}

          {/* Loading indicator while video loads */}
          {isHovering && isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold leading-tight transition-colors group-hover:text-primary line-clamp-1">
              {name}
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs whitespace-nowrap">
              {category}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
          
          {/* Button styled div */}
          <div className="w-full h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm flex items-center justify-center">
            Customize
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TemplateCard;