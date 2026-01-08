import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { Region } from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { ZoomIn, ZoomOut, Activity } from 'lucide-react';
import { SubtitleLine } from '@/core/types.ts';

interface WaveformDisplayProps {
  audioSrc: string;
  currentTime: number;
  onSeek: (time: number) => void;
  subtitles: SubtitleLine[];
  onSubtitleChange: (id: number, start: number, end: number) => void;
}

/**
 * Visualizes the audio track of the video using WaveSurfer.js.
 * Allows seeking, zooming, and editing subtitle regions.
 */
const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
                                                           audioSrc,
                                                           currentTime,
                                                           onSeek,
                                                           subtitles,
                                                           onSubtitleChange
                                                         }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const wsRegions = useRef<RegionsPlugin | null>(null);
  const [zoom, setZoom] = useState<number>(50); // Default pixels per second
  const [isReady, setIsReady] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || !audioSrc) return;

    setIsReady(false);

    // Initialize Regions Plugin
    const regions = RegionsPlugin.create();
    wsRegions.current = regions;

    // Create WaveSurfer instance
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
      plugins: [regions],
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

    // Region Events
    // When a region finishes dragging/resizing
    regions.on('region-updated', (region: Region) => {
      const id = parseInt(region.id);
      if (!isNaN(id)) {
        onSubtitleChange(id, region.start, region.end);
      }
    });

    regions.on('region-clicked', (region: Region, e: MouseEvent) => {
      e.stopPropagation();
      onSeek(region.start);
    });

    wavesurfer.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioSrc]); // Re-init on new audio source

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

  // Sync Regions with Subtitles prop
  useEffect(() => {
    if (!wsRegions.current || !isReady) return;

    // We need to update regions to match subtitles state.
    // To allow smooth dragging without React re-renders interrupting,
    // we only do a full sync here.
    // Since 'subtitles' prop updates happen AFTER 'region-updated',
    // this will essentially confirm the position or update if changed externally (e.g. offset tool).

    const regionsPlugin = wsRegions.current;

    // Simple synchronization: clear and redraw
    // A more complex diffing could be implemented if performance becomes an issue with thousands of subtitles.
    regionsPlugin.clearRegions();

    subtitles.forEach(sub => {
      regionsPlugin.addRegion({
        id: sub.id.toString(),
        start: sub.startTime,
        end: sub.endTime,
        content: sub.text.substring(0, 15) + (sub.text.length > 15 ? '...' : ''),
        color: sub.locked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)', // Red if locked, Indigo if unlocked
        drag: !sub.locked,
        resize: !sub.locked,
      });
    });

  }, [subtitles, isReady]);

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

      {/* Region Style Overrides (Optional: to style the region labels) */}
      <style>{`
        .wavesurfer-region {
          border: 1px solid rgba(99, 102, 241, 0.5) !important;
          border-radius: 4px;
        }
        .wavesurfer-region:hover {
          background-color: rgba(99, 102, 241, 0.3) !important;
          z-index: 10;
        }
        /* Locked regions specific styling if needed */
        
        /* Style the label content inside region */
        .wavesurfer-region::before {
           /* Content is inserted by plugin, just styling text color */
           color: rgba(255,255,255,0.7);
           font-size: 10px;
           padding: 2px;
           overflow: hidden;
           white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default WaveformDisplay;