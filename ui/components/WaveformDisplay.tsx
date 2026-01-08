import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { ZoomIn, ZoomOut, Activity } from 'lucide-react';

interface WaveformDisplayProps {
  audioSrc: string;
  currentTime: number;
  onSeek: (time: number) => void;
}

/**
 * Visualizes the audio track of the video using WaveSurfer.js.
 * Allows seeking and zooming.
 */
const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ audioSrc, currentTime, onSeek }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [zoom, setZoom] = useState<number>(50); // Default pixels per second
  const [isReady, setIsReady] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || !audioSrc) return;

    setIsReady(false);

    // Create instance
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f46e5', // Indigo-600
      progressColor: '#818cf8', // Indigo-400
      cursorColor: '#ef4444', // Red-500
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 64, // Compact height
      normalize: true,
      minPxPerSec: zoom,
      fillParent: true,
      interact: true, // Allow clicking to seek
      autoScroll: true,
    });

    // Load audio
    ws.load(audioSrc);

    // Events
    ws.on('ready', () => {
      setIsReady(true);
      // Set initial volume to 0 so it doesn't play double audio (video plays audio)
      ws.setVolume(0); 
    });

    ws.on('interaction', (newTime) => {
      onSeek(newTime);
    });

    wavesurfer.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioSrc]);

  // Handle Zoom Changes
  useEffect(() => {
    if (wavesurfer.current && isReady) {
      wavesurfer.current.zoom(zoom);
    }
  }, [zoom, isReady]);

  // Sync with Video Playback Time
  useEffect(() => {
    if (wavesurfer.current && isReady) {
      // Avoid jitter by checking difference
      const currentWsTime = wavesurfer.current.getCurrentTime();
      if (Math.abs(currentWsTime - currentTime) > 0.1) {
         wavesurfer.current.setTime(currentTime);
      }
    }
  }, [currentTime, isReady]);

  const handleZoomIn = () => setZoom((prev: number) => Math.min(prev + 20, 500));
  const handleZoomOut = () => setZoom((prev: number) => Math.max(prev - 20, 10));

  if (!audioSrc) return null;

  return (
    <div className="border-b border-slate-800 bg-slate-900/50 flex flex-col relative group">
      {/* Loading Overlay */}
      {!isReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm text-slate-400 text-xs">
          <Activity className="animate-pulse mr-2" size={16} />
          Extracting Waveform...
        </div>
      )}

      {/* Controls Overlay (Top Right) */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={handleZoomOut}
          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button 
          onClick={handleZoomIn}
          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
      </div>

      {/* Waveform Container */}
      <div ref={containerRef} className="w-full" />
    </div>
  );
};

export default WaveformDisplay;