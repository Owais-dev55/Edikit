"use client";

import { useState, useRef } from "react";
import { Play, Pause, RotateCcw, Maximize2, Volume2, VolumeX, Download } from "lucide-react";
import VideoDownloadButton from "./VideoDownloadButton";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  showDownload?: boolean;
  downloadFilename?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "thumbnail";
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  showDownload = true,
  downloadFilename,
  className = "",
  aspectRatio = "video",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleReset = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.().catch(() => {
        console.log("Fullscreen request failed");
      });
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const aspectRatioClasses = {
    video: "aspect-video",
    square: "aspect-square",
    thumbnail: "aspect-[16/9]",
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className={`relative bg-black rounded-lg overflow-hidden group ${aspectRatioClasses[aspectRatio]} ${className}`}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          className="w-full h-full object-cover"
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Video Controls Overlay */}
        {controls && (
          <div className="absolute inset-0 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-t from-black/80 via-transparent to-black/20">
            {/* Play/Pause Button (Center) */}
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white fill-white" />
                ) : (
                  <Play className="w-8 h-8 text-white fill-white" />
                )}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="space-y-2 p-4">
              {/* Progress Bar */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    if (!videoRef.current) return;
                    videoRef.current.currentTime = parseFloat(e.target.value);
                    setCurrentTime(parseFloat(e.target.value));
                  }}
                  className="w-full h-1 bg-white/30 rounded-full cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-white/70">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-white fill-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white fill-white" />
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Restart"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                  </button>
                </div>

                <button
                  onClick={handleFullscreen}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Download Button (Below Video) */}
      {showDownload && src && (
        <VideoDownloadButton
          videoUrl={src}
          filename={downloadFilename}
          size="lg"
          className="w-full"
        />
      )}
    </div>
  );
}
