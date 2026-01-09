import React, {useEffect, useRef, useState} from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, {Region} from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Minimap from 'wavesurfer.js/dist/plugins/minimap.esm.js';
import {ZoomIn, ZoomOut, Activity} from 'lucide-react';
import {SubtitleLine} from '../../core/types';

interface WaveformDisplayProps {
  audioSrc: string;
  currentTime: number;
  onSeek: (time: number) => void;
  subtitleLines: SubtitleLine[];
  onSubtitleChange: (id: number, start: number, end: number) => void;
  // tempSegment: { start: number; end: number } | null;
  onTempSegmentCreated: (start: number, end: number) => void;
  onTempSegmentUpdated: (start: number, end: number) => void;
  onTempSegmentRemoved: () => void;
  onEditSubtitle: (id: number) => void;
  onPlaySubtitle: (id: number) => void;
  onClickTempSegment: () => void;
  onToggleLock: (id: number) => void;
  onCreateCard: (id: number) => void;
  // onSelectedTimeSpanChanged: (start: number, end: number) => void;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
                                                           audioSrc,
                                                           currentTime,
                                                           onSeek,
                                                           subtitleLines,
                                                           onSubtitleChange,
                                                           // tempSegment,
                                                           onTempSegmentCreated,
                                                           onTempSegmentUpdated,
                                                           onTempSegmentRemoved,
                                                           onEditSubtitle,
                                                           onPlaySubtitle,
                                                           onClickTempSegment,
                                                           onToggleLock,
                                                           onCreateCard,
                                                           // onSelectedTimeSpanChanged: onSelectedTimeSpanUpdated,
                                                         }) => {
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const wsRegions = useRef<RegionsPlugin | null>(null);

  const [zoom, setZoom] = useState<number>(50);
  const [isReady, setIsReady] = useState(false);

  const isSyncingSubtitles = useRef(false);

  // Track creation of new regions
  const TEMP_REGION_ID = 'subs2anki-temp-segment';
  const tempTimeSpan = useRef<{ start: number, end: number } | null>(null);
  const activeDragRegionId = useRef<string | null>(null);
  // Track modification of existing regions
  // const draggingRegionId = useRef<string | null>(null);

  // Middle mouse dragging state
  const isMiddleDragging = useRef(false);
  const lastMouseX = useRef(0);

  const tempRegion = useRef<Region | null>(null);

  const lastestSubtitleLines = useRef<SubtitleLine[]>(subtitleLines);
  /*
  useEffect(() => {
    lastestSubtitleLines.current = subtitleLines;
  }, [subtitleLines]);
   */

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
      // content: 'Right click to dismiss',
      color: 'rgba(74, 222, 128, 0.4)',
    });

    ws.load(audioSrc);

    ws.on('ready', () => {
      setIsReady(true);
      ws.setVolume(0);
    });

    ws.on('interaction', (newTime) => {
      onSeek(newTime);

      tempRegion.current?.remove();
      onTempSegmentRemoved();
    });

    // --- Region Events ---

    regions.on('region-created', (region: Region) => {
      if (isSyncingSubtitles.current) return;
      // remove the previous temp region if there is one
      tempRegion.current?.remove();
      tempRegion.current = region;
      region.setOptions({content: 'Right click to dismiss'});
      region.element.addEventListener('contextmenu', (e: MouseEvent) => {
        e.preventDefault();
        tempRegion.current = null;
        setTimeout(() => region.remove(), 0);
        onTempSegmentRemoved();
      });
      onTempSegmentCreated(region.start, region.end);
    });

    regions.on('region-updated', (region: Region) => {
      console.log("on region-updated", region.id);
      if (isSyncingSubtitles.current) return;

      console.log("on region-updated1", region.id);
      /*
      if (activeDragRegionId.current !== region.id) {
        // draggingRegionId.current = region.id;
      }
       */

      console.log("on region-updated2", region.id);
      if (region.id === TEMP_REGION_ID) {
        onTempSegmentUpdated(region.start, region.end);
      } else {
        const id = parseInt(region.id);
        if (!isNaN(id)) {
          onSubtitleChange(id, region.start, region.end);
        }
      }
    });

    regions.on('region-clicked', (region: Region, e: MouseEvent) => {
      console.log("on region-clicked", region.id);
      e.stopPropagation();
      if (region.id === TEMP_REGION_ID) {
        onClickTempSegment();
      } else {
        const id = parseInt(region.id);
        console.log(lastestSubtitleLines.current);
        const sub = lastestSubtitleLines.current.find(s => s.id === id);
        console.log(sub);
        onPlaySubtitle(id);
        /*
        if (!isNaN(id)) {
          onPlaySubtitle(id);
        } else {
          onSeek(region.start);
        }
        */
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

  /*
  // Middle Mouse Panning Logic
  useEffect(() => {
    const waveformContainer = waveformContainerRef.current;
    if (!waveformContainer) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // Middle Button
        e.preventDefault();
        e.stopPropagation(); // Stop propagation to prevent standard scrolling triggers
        isMiddleDragging.current = true;
        lastMouseX.current = e.clientX;
        waveformContainer.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isMiddleDragging.current && wavesurfer.current) {
        e.preventDefault();
        const delta = lastMouseX.current - e.clientX;
        lastMouseX.current = e.clientX;

        const ws = wavesurfer.current;
        if (typeof ws.setScroll === 'function') {
          const current = ws.getScroll();
          ws.setScroll(current + delta);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isMiddleDragging.current) {
        isMiddleDragging.current = false;
        if (waveformContainer) waveformContainer.style.cursor = 'auto';
      }
    };

    waveformContainer.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const handleAuxClick = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };
    waveformContainer.addEventListener('auxclick', handleAuxClick);

    return () => {
      waveformContainer.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      waveformContainer.removeEventListener('auxclick', handleAuxClick);
    };
  }, []);
  */

  /*
  // Global Mouse Up Listener for Regions
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (activeDragRegionId.current && wsRegions.current) {
        const region = wsRegions.current.getRegions().find(r => r.id === activeDragRegionId.current);
        if (region) {
          const oldTemp = wsRegions.current.getRegions().find(r => r.id === TEMP_REGION_ID);
          if (oldTemp) oldTemp.remove();

          if (region.end - region.start > 0.2) {
            onTempSegmentCreated(region.start, region.end);
            region.remove();
          } else {
            region.remove();
          }
        }
        activeDragRegionId.current = null;
      }

      if (draggingRegionId.current && wsRegions.current) {
        const regionId = draggingRegionId.current;
        if (regionId === TEMP_REGION_ID) {
          onClickTempSegment();
        } else {
          const id = parseInt(regionId);
          if (!isNaN(id)) onPlaySubtitle(id);
        }
        draggingRegionId.current = null;
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [onTempSegmentCreated, onPlaySubtitle, onClickTempSegment, onSeek]);
  */

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

  useEffect(() => { // Sync Regions on [subtitleLines, isReady]
    if (!wsRegions.current || !isReady) return;

    if (lastestSubtitleLines.current !== subtitleLines)
    {
      lastestSubtitleLines.current = subtitleLines;
    }
    /*
    const pre = previousThings.current;

    if (pre?.subtitles !== subtitles)
    {
      console.log('subtitle changed');
    }

    if (pre?.isReady !== isReady)
    {
      console.log('isReady changed');
    }

    previousThings.current = {subtitles, isReady};
     */

    isSyncingSubtitles.current = true;
    const regionsPlugin = wsRegions.current;

    const existingRegions = new Map(regionsPlugin.getRegions().map(r => [r.id, r]));
    const processedIds = new Set<string>();

    /*
    if (tempSegment) {
      processedIds.add(TEMP_REGION_ID);
      if (draggingRegionId.current !== TEMP_REGION_ID) {
        const r = existingRegions.get(TEMP_REGION_ID);
        if (r) {
          if (Math.abs(r.start - tempSegment.start) > 0.01) r.start = tempSegment.start;
          if (Math.abs(r.end - tempSegment.end) > 0.01) r.end = tempSegment.end;
        } else {
          regionsPlugin.addRegion({
            id: TEMP_REGION_ID,
            start: tempSegment.start,
            end: tempSegment.end,
            content: 'New Subtitle',
            color: 'rgba(74, 222, 128, 0.4)',
            drag: true,
            resize: true,
          });
        }
      }
    }
     */
    const l = lastestSubtitleLines.current[1];
    console.log(`subtitle lines:`, l);

    subtitleLines.forEach(sub => {
      const idStr = sub.id.toString();
      processedIds.add(idStr);

      // if (draggingRegionId.current === idStr) return;

      const r = existingRegions.get(idStr);
      const color = sub.locked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)';
      // const content = sub.text.substring(0, 15) + (sub.text.length > 15 ? '...' : '');
      const content = sub.text;

      if (r) {
        if (Math.abs(r.start - sub.startTime) > 0.01) r.start = sub.startTime;
        if (Math.abs(r.end - sub.endTime) > 0.01) r.end = sub.endTime;
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

    existingRegions.forEach((r, id) => {
      if (id === activeDragRegionId.current) return;
      if (!processedIds.has(id)) {
        r.remove();
      }
    });

    setTimeout(() => {
      isSyncingSubtitles.current = false;
    }, 0);

  }, [subtitleLines, isReady]); // end of Sync Regions

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
        /* Custom scrollbar for minimap if needed, though wavesurfer handles it */
      `}</style>
    </div>
  );
};

export default WaveformDisplay;
