
import React, {useEffect, useRef, useState} from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, {Region} from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Minimap from 'wavesurfer.js/dist/plugins/minimap.esm.js';
import {ZoomIn, ZoomOut, Activity} from 'lucide-react';
import { useAppStore } from '../../core/store';

interface WaveformDisplayProps {
  audioSrc: string;
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
  audioSrc,
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
  const activeDragRegionId = useRef<string | null>(null);
  const tempRegion = useRef<Region | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformContainerRef.current || !audioSrc) return;

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
      waveColor: '#4f46e5',
      progressColor: '#818cf8',
      cursorColor: '#ef4444',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 140, // Reduced height to fit minimap
      normalize: true,
      minPxPerSec: zoom,
      fillParent: true,
      interact: true,
      autoScroll: true,
      plugins: [regions, minimap],
    });

    regions.enableDragSelection({
      id: TEMP_REGION_ID,
      color: 'rgba(74, 222, 128, 0.4)',
    });

    ws.load(audioSrc);

    ws.on('ready', () => {
      setIsReady(true);
      ws.setVolume(0);
    });

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
          // Update store directly or via parent callback? 
          // Parent callback updates store, which loops back here.
          // For performance, this is fine as long as we don't stutter.
          // Using the store action directly is also an option if props are removed.
          // For now, adhere to prop contract for update:
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
  }, [audioSrc]);

  // Handle Zoom
  useEffect(() => {
    if (wavesurfer.current && isReady) {
      wavesurfer.current.zoom(zoom);
    }
  }, [zoom, isReady]);

  // Sync Video Time
  useEffect(() => {
    if (wavesurfer.current && isReady) {
      const currentWsTime = wavesurfer.current.getCurrentTime();
      if (Math.abs(currentWsTime - currentTime) > 0.1) {
        wavesurfer.current.setTime(currentTime);
      }
    }
  }, [currentTime, isReady]);

  // Sync Regions with Store Data
  // This replaces the complex prop watching with direct store usage (via the subtitleLines prop passed from App which is now store-bound)
  // or strictly speaking, we could subscribe here. Since App passes it as a prop from the store, it's reactive.
  useEffect(() => {
    if (!wsRegions.current || !isReady) return;

    isSyncingSubtitles.current = true;
    const regionsPlugin = wsRegions.current;

    const existingRegions = new Map(regionsPlugin.getRegions().map(r => [r.id, r]));
    const processedIds = new Set<string>();

    subtitleLines.forEach(sub => {
      const idStr = sub.id.toString();
      processedIds.add(idStr);

      const r = existingRegions.get(idStr);
      const color = sub.locked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)';
      const content = sub.text;

      if (r) {
        // Only update if difference is significant to avoid infinite loops on float precision
        if (Math.abs(r.start - sub.startTime) > 0.01) r.start = sub.startTime;
        if (Math.abs(r.end - sub.endTime) > 0.01) r.end = sub.endTime;
        
        // Update styling/content
        r.setOptions({drag: !sub.locked, resize: !sub.locked, color, content});
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

    // Cleanup deleted regions (except temp)
    existingRegions.forEach((r, id) => {
      if (id === TEMP_REGION_ID) return;
      if (!processedIds.has(id)) {
        r.remove();
      }
    });

    // Reset flag immediately
    isSyncingSubtitles.current = false;

  }, [subtitleLines, isReady]); // Reacts to store changes

  const handleZoomIn = () => setZoom((prev: number) => Math.min(prev + 20, 500));
  const handleZoomOut = () => setZoom((prev: number) => Math.max(prev - 20, 10));

  if (!audioSrc) return null;

  return (
    <div className="h-full w-full flex flex-col relative group select-none bg-slate-900/50">
      {!isReady && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm text-slate-400 text-xs">
          <Activity className="animate-pulse mr-2" size={16}/>
          Extracting Waveform...
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
