"use client";

import { useState } from "react";
import { X, Play, ExternalLink } from "lucide-react";

type YouTubePlayerProps = {
  videoUrl: string;
  title: string;
  onClose: () => void;
};

function extractYouTubeId(url: string): string | null {
  // Handle youtube.com/watch?v=ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Handle youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Handle youtube.com/embed/ID
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

export function YouTubePlayer({ videoUrl, title, onClose }: YouTubePlayerProps) {
  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) return null;

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-4xl mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#0f0f0f] rounded-t-2xl px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <p className="text-white text-sm font-medium truncate">{title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              title="Open in YouTube"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-red-500/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="relative w-full bg-black rounded-b-2xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}

type VideoThumbnailProps = {
  videoUrl: string;
  title: string;
  duration?: number;
  className?: string;
};

export function VideoThumbnail({ videoUrl, title, duration, className = "" }: VideoThumbnailProps) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <>
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className={`group relative w-full overflow-hidden rounded-xl border border-border bg-black/5 transition-all hover:border-primary/40 hover:shadow-md ${className}`}
      >
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-0.5 rounded">
              {duration} min
            </div>
          )}
        </div>
      </button>

      {playing && (
        <YouTubePlayer
          videoUrl={videoUrl}
          title={title}
          onClose={() => setPlaying(false)}
        />
      )}
    </>
  );
}

export { extractYouTubeId };
