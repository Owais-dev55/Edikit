'use client';
import { useRef, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
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

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && isVideoLoaded) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className="group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Preview Container - Fixed Height */}
      <div className="relative h-64 overflow-hidden bg-muted">
        {/* Static Thumbnail */}
        {!isHovering && (
          <Image
            src={thumbnail}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}

        {/* Video (hidden until hover) */}
        <video
          ref={videoRef}
          src={previewUrl}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isHovering ? "opacity-100" : "opacity-0"
          }`}
          loop
          muted
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
        />

        {/* Play Icon Overlay */}
        {!isHovering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="h-5 w-5 fill-primary-foreground text-primary-foreground ml-0.5" />
            </div>
          </div>
        )}

        {/* Duration Badge */}
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
        <Link href={`/customize/${id}`}>
          <button className="w-full h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors font-medium text-sm">
            Customize
          </button>
        </Link>
      </div>
    </div>
  );
};

export default TemplateCard;
