import React, { useRef, forwardRef, useImperativeHandle } from 'react';

interface VideoPlayerProps {
  src: string;
  onTimeUpdate: (time: number) => void;
}

/**
 * Interface exposed to the parent component via ref.
 * Allows direct control over the video element.
 */
export interface VideoPlayerHandle {
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
  captureFrame: () => string | null;
  captureFrameAt: (time: number) => Promise<string | null>;
  getCurrentTime: () => number;
}

/**
 * A wrapper around the HTML5 video element.
 * 
 * Features:
 * - Exposes imperative handle for control (seek, play, pause).
 * - Implements frame capture logic using an internal Canvas.
 * - Supports capturing frames at specific timestamps regardless of visibility.
 */
const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({ src, onTimeUpdate }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    
    /**
     * Captures the current frame of the video as a base64 JPEG image.
     */
    captureFrame: () => {
      if (!videoRef.current) return null;
      return captureImageFromVideo(videoRef.current);
    },

    /**
     * Captures a frame at a specific timestamp.
     * Pauses, seeks, waits for seek to complete, captures, and effectively leaves the video at that timestamp (paused).
     */
    captureFrameAt: async (time: number) => {
      const video = videoRef.current;
      if (!video) return null;

      // Ensure paused to prevent race conditions during seek
      video.pause();

      return new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          const dataUrl = captureImageFromVideo(video);
          resolve(dataUrl);
        };

        // Attach event listener before triggering seek
        video.addEventListener('seeked', onSeeked, { once: true });
        
        // Trigger seek
        video.currentTime = time;
      });
    }
  }));

  const captureImageFromVideo = (video: HTMLVideoElement): string | null => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.85); 
      }
    } catch (e) {
      console.error("Frame capture failed", e);
    }
    return null;
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-slate-800">
      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          controls
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          crossOrigin="anonymous" // Important for canvas tainting if loading from some sources
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-500">
          <p>No video loaded</p>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;