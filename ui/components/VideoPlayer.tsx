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
  getCurrentTime: () => number;
}

/**
 * A wrapper around the HTML5 video element.
 * 
 * Features:
 * - Exposes imperative handle for control (seek, play, pause).
 * - Implements frame capture logic using an internal Canvas.
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
     * Draws the video element onto a temporary canvas.
     */
    captureFrame: () => {
      if (!videoRef.current) return null;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        // Returns a data URL (base64 string) with 0.85 quality JPEG compression
        return canvas.toDataURL('image/jpeg', 0.85); 
      }
      return null;
    }
  }));

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-slate-800">
      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          controls
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
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