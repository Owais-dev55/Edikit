"use client";

import { Play, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

const Video = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(true);
  };

  const handleLoaded = () => {
    setIsLoading(false);
    videoRef.current?.play().catch(() => {});
  };

  const handleEnded = () => {
    // Reset back to image state
    setIsPlaying(false);
    setIsLoading(false);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="order-2 lg:order-1">
      <div className="relative aspect-video rounded-2xl bg-linear-to-br from-primary/20 to-purple-600/20 border-2 border-primary/30 overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">

        {/* Video */}
        {isPlaying && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            src="/previews/animation-10.mp4"
            playsInline
            onLoadedData={handleLoaded}
            onEnded={handleEnded}
          />
        )}

        {/* Poster Image */}
        {!isPlaying && (
          <Image
            src="/previews/hero image.png"
            alt="Hero Image"
            fill
            className="object-cover"
            priority
          />
        )}

        {/* Loader */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* Play Overlay */}
        {!isPlaying && !isLoading && (
          <div
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center cursor-pointer bg-linear-to-b from-transparent via-transparent to-black/20"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center hover:bg-primary/30 transition-colors">
              <Play className="w-10 h-10 text-primary" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Video;
