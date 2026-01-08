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
  onNewSegment: (start: number, end: number) => void;
}

/**
 * Visualizes the audio track of the video using WaveSurfer.js.
 * Allows seeking, zooming, editing subtitle regions, and creating new ones by dragging.
 */
const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
                                                           audioSrc,
                                                           currentTime,
                                                           onSeek,
                                                           subtitles,
                                                           onSubtitleChange,
                                                           onNewSegment
                                                         }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const wsRegions = useRef<RegionsPlugin | null>(null);
  const [zoom, setZoom] = useState<number>(50); // Default pixels per second
  const [isReady, setIsReady] = useState(false);

  // Ref to track if we are currently programmatically syncing subtitles.
  // This prevents the 'region-created' event from triggering new segment logic during initial load/update.
  const isSyncingSubtitles = useRef(false);
  
  // Ref to track the ID of the region currently being drawn by the user
  const activeDragRegionId = useRef<string | null>(null);

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

    // Enable drag selection to create new regions
    regions.enableDragSelection({
      color: 'rgba(255, 255, 255, 0.2)', // Distinct color for temporary new region
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

    // --- Region Events ---

    // 1. User starts creating a region (dragging on empty space)
    regions.on('region-created', (region: Region) => {
      if (!isSyncingSubtitles.current) {
        // This is a user interaction, track this region
        activeDragRegionId.current = region.id;
      }
    });

    // 2. Existing region is modified
    regions.on('region-updated', (region: Region) => {
      // If it's a known subtitle ID (integer), update parent
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

  // Global Mouse Up Listener to detect end of drag creation
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (activeDragRegionId.current && wsRegions.current) {
        const region = wsRegions.current.getRegions().find(r => r.id === activeDragRegionId.current);
        if (region) {
          // Trigger new segment callback
          // Ensure min duration to avoid accidental clicks
          if (region.end - region.start > 0.2) {
             onNewSegment(region.start, region.end);
          }
          // Remove the temporary region (App will add the real one via props)
          region.remove();
        }
        activeDragRegionId.current = null;
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [onNewSegment]);

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

    // Signal that we are performing programmatic updates
    isSyncingSubtitles.current = true;

    const regionsPlugin = wsRegions.current;
    
    // Clear and redraw
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

    // Reset flag after a microtask to allow events to settle
    setTimeout(() => {
      isSyncingSubtitles.current = false;
    }, 0);

  }, [subtitles, isReady]);

  const handleZoomIn = () => setZoom((prev: number) => Math.min(prev + 20, 500));
  const handleZoomOut = () => setZoom((prev: number) => Math.max(prev - 20, 10));

  if (!audioSrc) return null;

  return (
    <div className="border-b border-slate-800 bg-slate-900/50 flex flex-col relative group select-none">
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

      {/* Region Style Overrides */}
      <style>{`
        .wavesurfer-region {
          border: 1px solid rgba(99, 102, 241, 0.5) !important;
          border-radius: 4px;
        }
        .wavesurfer-region:hover {
          background-color: rgba(99, 102, 241, 0.3) !important;
          z-index: 10;
        }
        .wavesurfer-region::before {
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