/// <reference lib="dom" />
import React, {useEffect, useRef, useState} from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, {Region} from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Minimap from 'wavesurfer.js/dist/plugins/minimap.esm.js';
import {ZoomIn, ZoomOut, Activity, AlertTriangle} from 'lucide-react';
import { useAppStore } from '../../core/store';

interface WaveformDisplayProps {
  // Removed audioSrc as we use the videoElement directly
  videoElement: HTMLVideoElement | null;
  currentTime: number;
  onSeek: (time: number) => void;
  onTempSubtitleLineCreated: (start: number, end: number) => void;
  onTempSubtitleLineUpdated: (start: number, end: number) => void;
  onTempSubtitleLineClicked: () => void;
  onTempSubtitleLineRemoved: () => void;
  onEditSubtitle: (id: number) => void;
  onPlaySubtitle: (id: number) => void;
  onToggleLock: (id: number) => void;
  onCreateCard: (id: number) => void;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
                                                           videoElement,
                                                           currentTime,
                                                           onSeek,
                                                           onTempSubtitleLineCreated,
                                                           onTempSubtitleLineUpdated,
                                                           onTempSubtitleLineClicked,
                                                           onTempSubtitleLineRemoved,
                                                           onEditSubtitle,
                                                           onPlaySubtitle,
                                                           onToggleLock
                                                         }) => {
  // Access store for direct reads in listeners and reactive updates
  const { subtitleLines, updateSubtitleTime } = useAppStore();

  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const wsRegions = useRef<RegionsPlugin | null>(null);

  const [zoom, setZoom] = useState<number>(50);
  const [isReady, setIsReady] = useState(false);

  const isSyncingSubtitles = useRef(false);

  // Constants & Refs
  const TEMP_REGION_ID = 'subs2anki-temp-segment';
  const tempRegion = useRef<Region | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformContainerRef.current || !videoElement) return;

    // Destroy previous instance if it exists
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }

    setIsReady(false);
    const regions = RegionsPlugin.create();
    wsRegions.current = regions;

    // Create Minimap Plugin
    const minimap = Minimap.create({
      height: 30,
      waveColor: '#4f46e5',
      progressColor: '#818cf8',
      overlayColor: 'rgba(255, 255, 255, 0.1)',
      cursorWidth: 1,
      cursorColor: '#ef4444',
    });

    const ws = WaveSurfer.create({
      container: waveformContainerRef.current,
      media: videoElement, // Use the video element directly!
      waveColor: '#4f46e5',
      progressColor: '#818cf8',
      cursorColor: '#ef4444',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 140,
      minPxPerSec: zoom,
      fillParent: true,
      interact: true,
      autoScroll: true,
      plugins: [regions, minimap],
      // Important: By not providing a URL, we prevent fetching/decoding.
      // However, to see a waveform, WaveSurfer normally needs to decode.
      // Using 'media' binds the playhead.
      // NOTE: Without pre-decoded peaks, WaveSurfer might try to fetch the src of the video element.
      // This is unavoidable for visualization unless we use peaks.
      // But for local files (blob:), standard fetch is often optimized or handled by browser cache better than decodeAudioData.
    });

    regions.enableDragSelection({
      id: TEMP_REGION_ID,
      color: 'rgba(74, 222, 128, 0.4)',
    });

    ws.on('ready', () => {
      setIsReady(true);
    });

    // WaveSurfer 'interaction' event is triggered when user clicks/drags on waveform
    ws.on('interaction', (newTime) => {
      onSeek(newTime);
      // Remove temp region if clicking elsewhere on timeline
      if (tempRegion.current) {
        tempRegion.current.remove();
        onTempSubtitleLineRemoved();
      }
    });

    // --- Region Events ---

    regions.on('region-created', (region: Region) => {
      if (isSyncingSubtitles.current) return;

      // Handle Temp Region logic
      if (region.id === TEMP_REGION_ID) {
        // remove the previous temp region if there is one (to enforce singleton)
        if (tempRegion.current && tempRegion.current !== region) {
          tempRegion.current.remove();
        }
        tempRegion.current = region;
        region.setOptions({content: 'Right click to dismiss'});

        // Add right-click to dismiss behavior
        region.element.addEventListener('contextmenu', (e: MouseEvent) => {
          e.preventDefault();
          region.remove();
          tempRegion.current = null;
          onTempSubtitleLineRemoved();
        });

        onTempSubtitleLineCreated(region.start, region.end);
      }
    });

    regions.on('region-updated', (region: Region) => {
      if (isSyncingSubtitles.current) return;

      if (region.id === TEMP_REGION_ID) {
        onTempSubtitleLineUpdated(region.start, region.end);
      } else {
        const id = parseInt(region.id);
        if (!isNaN(id)) {
          updateSubtitleTime(id, region.start, region.end);
        }
      }
    });

    regions.on('region-clicked', (region: Region, e: MouseEvent) => {
      e.stopPropagation();
      if (region.id === TEMP_REGION_ID) {
        onTempSubtitleLineClicked();
      } else {
        const id = parseInt(region.id);
        if (!isNaN(id)) {
          onPlaySubtitle(id);
        }
      }
    });

    regions.on('region-double-clicked', (region: Region, e: MouseEvent) => {
      e.stopPropagation();
      if (region.id !== TEMP_REGION_ID) {
        const id = parseInt(region.id);
        if (!isNaN(id)) {
          onEditSubtitle(id);
        }
      }
    });

    wavesurfer.current = ws;

    return () => {
      ws.destroy();
    };
  }, [videoElement]); // Re-run when video source changes

  // Handle Zoom
  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.zoom(zoom);
    }
  }, [zoom]);

  // Sync Regions with Store Data
  useEffect(() => {
    if (!wsRegions.current) return;

    isSyncingSubtitles.current = true;
    const regionsPlugin = wsRegions.current;

    const existingRegions = new Map<string, Region>(
      regionsPlugin.getRegions().map((r: Region) => [r.id, r])
    );
    const processedIds = new Set<string>();

    subtitleLines.forEach(sub => {
      const idStr = sub.id.toString();
      processedIds.add(idStr);

      const r = existingRegions.get(idStr);
      const color = sub.locked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)';
      const content = sub.text;

      if (r) {
        // Use setOptions for start/end to ensure the UI updates reliably.
        // Direct assignment might not always trigger a redraw in some scenarios.
        r.setOptions({
          start: sub.startTime,
          end: sub.endTime,
          drag: !sub.locked,
          resize: !sub.locked,
          color,
          content
        });
      } else {
        const newRegion = regionsPlugin.addRegion({
          id: idStr,
          start: sub.startTime,
          end: sub.endTime,
          content,
          color,
          drag: !sub.locked,
          resize: !sub.locked,
        });
        if (newRegion.element) {
          newRegion.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            onToggleLock(sub.id);
          });
        }
      }
    });

    existingRegions.forEach((r, id) => {
      if (id === TEMP_REGION_ID) return;
      if (!processedIds.has(id)) {
        r.remove();
      }
    });

    isSyncingSubtitles.current = false;

  }, [subtitleLines, isReady]);

  const handleZoomIn = () => setZoom((prev: number) => Math.min(prev + 20, 500));
  const handleZoomOut = () => setZoom((prev: number) => Math.max(prev - 20, 10));

  if (!videoElement) return null;

  return (
    <div className="h-full w-full flex flex-col relative group select-none bg-slate-900/50">
      {!isReady && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm text-slate-400 text-xs">
          <Activity className="animate-pulse mr-2" size={16}/>
          Loading Audio Track...
        </div>
      )}

      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleZoomOut}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700"><ZoomOut
          size={14}/></button>
        <button onClick={handleZoomIn}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700"><ZoomIn
          size={14}/></button>
      </div>

      <div ref={waveformContainerRef} className="w-full h-full"/>

      <style>{`
        .wavesurfer-region {
          border: 1px solid rgba(99, 102, 241, 0.5) !important;
          border-radius: 4px;
        }
        .wavesurfer-region[data-region-id="${TEMP_REGION_ID}"] {
           border: 1px solid rgba(74, 222, 128, 0.8) !important;
           background-color: rgba(74, 222, 128, 0.3) !important;
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