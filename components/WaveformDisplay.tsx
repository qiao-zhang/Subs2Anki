import React, {useEffect, useRef, useState} from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, {Region} from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Minimap from 'wavesurfer.js/dist/plugins/minimap.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import {ZoomIn, ZoomOut, Activity} from 'lucide-react';
import {useAppStore} from '@/services/store.ts';

interface WaveformDisplayProps {
  videoElement: HTMLVideoElement | null;
  videoSrc: string;
  currentTime: number;
  onSeek: (time: number) => void;
  regionsHidden: boolean;
  onTempSubtitleLineCreated: (start: number, end: number) => void;
  onTempSubtitleLineUpdated: (start: number, end: number) => void;
  onTempSubtitleLineClicked: () => void;
  onTempSubtitleLineRemoved: () => void;
  onSubtitleLineClicked: (id: number) => void;
  onSubtitleLineRemoved: (id: number) => void;
  onCreateCard: (id: number) => void;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
                                                           videoElement,
                                                           videoSrc,
                                                           onSeek,
                                                           regionsHidden,
                                                           onTempSubtitleLineCreated,
                                                           onTempSubtitleLineUpdated,
                                                           onTempSubtitleLineClicked,
                                                           onTempSubtitleLineRemoved,
                                                           onSubtitleLineClicked,
                                                           onSubtitleLineRemoved,
                                                         }) => {
  // Access store for direct reads in listeners and reactive updates
  const {subtitleLines, updateSubtitleTime, getSubtitleLine, toggleSubtitleLineStatus, groupSubtitles} = useAppStore();

  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const wsRegions = useRef<RegionsPlugin | null>(null);

  const [zoom, setZoom] = useState<number>(50);
  const [isReady, setIsReady] = useState(false);

  const isSyncingSubtitles = useRef(false);

  // Multi-selection state
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const selectedRegionsRef = useRef<Set<string>>(new Set());

  // Constants & Refs
  const TEMP_REGION_ID = 'subs2anki-temp-segment';
  const tempRegion = useRef<Region | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformContainerRef.current || !videoElement) return;

    // If WaveSurfer is already initialized with the same video element, skip initialization
    if (wavesurfer.current && wavesurfer.current.getMediaElement() === videoElement) {
      return;
    }

    // Destroy previous instance if it exists
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }

    setIsReady(false);
    const regions = RegionsPlugin.create();
    wsRegions.current = regions;

    // Create Timeline Plugin
    // noinspection SpellCheckingInspection,JSUnusedGlobalSymbols
    const timeline = TimelinePlugin.create({
      // container: timelineContainerRef.current!, // 指定时间轴容器
      insertPosition: 'beforebegin',
      height: 20,
      primaryLabelInterval: 5,
      secondaryLabelInterval: 1,
      formatTimeCallback: (seconds) => {
        // 格式化时间为HH:MM:SS或MM:SS格式
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
          return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
      }
    });

    // Create Minimap Plugin
    const minimap = Minimap.create({
      height: 30,
      waveColor: '#4f46e5',
      progressColor: '#818cf8',
      overlayColor: 'rgba(255, 255, 255, 0.1)',
      cursorWidth: 1,
      cursorColor: '#ef4444',
    });

    const removeTempRegion = () => {
      if (tempRegion.current) {
        tempRegion.current.remove();
        tempRegion.current = null;
        onTempSubtitleLineRemoved();
      }
    }

    const ws = WaveSurfer.create({
      container: waveformContainerRef.current,
      media: videoElement, // Use the video element directly!
      waveColor: '#4f46e5',
      progressColor: '#818cf8',
      cursorColor: '#ef4444',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 120,
      minPxPerSec: zoom,
      fillParent: true,
      interact: true,
      autoScroll: true,
      plugins: [regions, minimap, timeline], // 添加时间轴插件
    });

    regions.enableDragSelection({
      id: TEMP_REGION_ID,
      color: 'rgba(74, 222, 128, 0.4)',
      content: 'Right-click to dismiss'
    });

    ws.on('ready', () => {
      console.log("is ready");
      setIsReady(true);
    });

    // WaveSurfer 'interaction' event is triggered when user clicks/drags on waveform
    ws.on('interaction', (newTime) => {
      videoElement.pause();
      onSeek(newTime);
      // Remove temp region if clicking elsewhere on timeline
      removeTempRegion();
      // Clear selection when clicking on empty space
      selectedRegionsRef.current.clear();
      setSelectedRegions(new Set());
    });

    // --- Region Events ---
    regions.on('region-created', (region: Region) => {

      region.element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (region.id === TEMP_REGION_ID) {
          region.remove();
          removeTempRegion();
          return;
        }
        const id = parseInt(region.id);
        if (!isNaN(id)) {
          region.remove();
          onSubtitleLineRemoved(id);
        }
        // Other regions?
      });

      if (isSyncingSubtitles.current) return;
      videoElement.pause();

      // Handle Temp Region logic
      if (region.id !== TEMP_REGION_ID) return;
      // remove the previous temp region if there is one (to enforce singleton)
      if (tempRegion.current && tempRegion.current !== region) {
        tempRegion.current.remove();
      }
      tempRegion.current = region;
      onTempSubtitleLineCreated(region.start, region.end);
    });

    regions.on('region-updated', (region: Region) => {
      if (isSyncingSubtitles.current) return;
      videoElement.pause();

      if (region.id === TEMP_REGION_ID) {
        onTempSubtitleLineUpdated(region.start, region.end);
        return;
      }
      const id = parseInt(region.id);
      if (isNaN(id)) return;
      removeTempRegion();
      updateSubtitleTime(id, region.start, region.end);
    });

    regions.on('region-clicked', (region: Region, e: MouseEvent) => {
      e.stopPropagation();
      if (region.id === TEMP_REGION_ID) {
        onTempSubtitleLineClicked();
        return;
      }
      removeTempRegion();
      const id = parseInt(region.id);
      if (isNaN(id)) return;

      if (e.shiftKey) {
        toggleSubtitleLineStatus(id);
        return;
      }

      // Handle multi-selection with Ctrl/Cmd key
      if (e.ctrlKey || e.metaKey) {
        // Toggle selection
        const newSelectedRegions = new Set(selectedRegionsRef.current);
        if (newSelectedRegions.has(region.id)) {
          newSelectedRegions.delete(region.id);
          const subtitleLine = getSubtitleLine(id);
          // Reset region color to default
          if (subtitleLine) {
            const color = subtitleLine.status === 'ignored' ? 'rgba(34, 197, 94, 0.2)' : // Green for ignored
              subtitleLine.status === 'locked' ? 'rgba(239, 68, 68, 0.2)' : // Red for locked
                'rgba(99, 102, 241, 0.2)'; // Blue for normal
            region.setOptions({color});
          }
        } else {
          newSelectedRegions.add(region.id);
          // Highlight selected region
          region.setOptions({color: 'rgba(255, 165, 0, 0.4)'}); // Orange for selected
        }

        selectedRegionsRef.current = newSelectedRegions;
        setSelectedRegions(newSelectedRegions);
        return;
      }

      // Normal click, need to clear previous selections
      selectedRegionsRef.current.forEach(selectedId => {
        if (selectedId !== region.id) {
          const selectedRegion = wsRegions.current?.getRegions().find(r => r.id === selectedId);
          if (selectedRegion) {
            const selectedIdNum = parseInt(selectedId);
            const subtitleLine = getSubtitleLine(selectedIdNum);
            if (subtitleLine) {
              const color = subtitleLine.status === 'ignored' ? 'rgba(34, 197, 94, 0.2)' : // Green for ignored
                subtitleLine.status === 'locked' ? 'rgba(239, 68, 68, 0.2)' : // Red for locked
                  'rgba(99, 102, 241, 0.2)'; // Blue for normal
              selectedRegion.setOptions({color});
            }
          }
        }
      });

      const newSelectedRegions = new Set([]);
      selectedRegionsRef.current = newSelectedRegions;
      setSelectedRegions(newSelectedRegions);

      // Highlight selected region
      region.setOptions({color: 'rgba(255, 165, 0, 0.4)'}); // Orange for selected

      onSubtitleLineClicked(id);
    });

    // Keyboard event listener for M (merge) and G (group) shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process shortcuts when focus is not on an input element
      if ((e.target as Element).tagName === 'INPUT' || (e.target as Element).tagName === 'TEXTAREA') {
        return;
      }

      if (e.key.toLowerCase() === 'm' && selectedRegionsRef.current.size > 1) {
        // Merge selected regions
        e.preventDefault();
        mergeSelectedRegions();
      } else if (e.key.toLowerCase() === 'g' && selectedRegionsRef.current.size > 1) {
        // Group selected regions
        e.preventDefault();
        groupSelectedRegions();
      }
    };

    // Prevent context menu on waveform container
    const waveformContainer = waveformContainerRef.current;
    const handleContextMenu = (e: Event) => {
      console.log('right clicked waveform container');
      e.preventDefault();
    };

    if (waveformContainer) {
      waveformContainer.addEventListener('contextmenu', handleContextMenu);
    }

    document.addEventListener('keydown', handleKeyDown);

    wavesurfer.current = ws;

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (waveformContainer) {
        waveformContainer.removeEventListener('contextmenu', handleContextMenu);
      }
      ws.destroy();
    };
  }, [videoElement, videoSrc]); // Re-run when video source or subtitle lines change

  // Handle Zoom
  useEffect(() => {
    if (wavesurfer.current && isReady) {
      wavesurfer.current.zoom(zoom);
    }
  }, [zoom, isReady]);

  // Function to merge selected regions
  const mergeSelectedRegions = () => {
    if (!wsRegions.current || selectedRegionsRef.current.size < 2) return;

    const selectedRegionObjects = Array.from(selectedRegionsRef.current)
      .map(id => wsRegions.current?.getRegions().find(r => r.id === id))
      .filter(Boolean) as Region[];

    if (selectedRegionObjects.length < 2) return;

    // Sort regions by start time
    selectedRegionObjects.sort((a, b) => a.start - b.start);

    // Extract subtitle IDs from selected regions
    const subtitleIds = selectedRegionObjects
      .map(region => parseInt(region.id))
      .filter(id => !isNaN(id));

    // Call the store function to merge the subtitles
    const {mergeSubtitleLines} = useAppStore.getState();
    mergeSubtitleLines(subtitleIds);

    // Clear selection after merging
    selectedRegionsRef.current.clear();
    setSelectedRegions(new Set());
  };

  // Function to group selected regions
  const groupSelectedRegions = () => {
    if (!wsRegions.current || selectedRegionsRef.current.size < 2) return;

    const selectedRegionObjects = Array.from(selectedRegionsRef.current)
      .map(id => wsRegions.current?.getRegions().find(r => r.id === id))
      .filter(Boolean) as Region[];

    if (selectedRegionObjects.length < 2) return;

    // Sort regions by start time
    selectedRegionObjects.sort((a, b) => a.start - b.start);

    // Extract subtitle IDs from selected regions
    const subtitleIds = selectedRegionObjects
      .map(region => parseInt(region.id))
      .filter(id => !isNaN(id));

    // Call the store function to group the subtitles
    groupSubtitles(subtitleIds);

    // Clear selection after grouping
    selectedRegionsRef.current.clear();
    setSelectedRegions(new Set());
  };

  // Sync Regions with Store Data
  useEffect(() => {
    if (!wsRegions.current || !isReady) return;

    isSyncingSubtitles.current = true;
    const regionsPlugin = wsRegions.current;

    const existingRegions = new Map<string, Region>(
      regionsPlugin.getRegions().map((r: Region) => [r.id, r])
    );
    if (regionsHidden) {
      console.log('hide all regions');
      existingRegions.forEach((r: Region) => {
        r.remove();
      });
      return;
    }
    const processedIds = new Set<string>();

    subtitleLines.forEach(sub => {
      const idStr = sub.id.toString();
      processedIds.add(idStr);

      const r = existingRegions.get(idStr);
      let color = sub.status === 'ignored' ? 'rgba(34, 197, 94, 0.2)' : // Green for ignored
        sub.status === 'locked' ? 'rgba(239, 68, 68, 0.2)' : // Red for locked
          'rgba(99, 102, 241, 0.2)'; // Blue for normal

      // Check if this region is selected
      if (selectedRegionsRef.current.has(idStr)) {
        color = 'rgba(255, 165, 0, 0.4)'; // Orange for selected
      }

      // Check if this region is grouped
      if (sub.groupId) {
        color = 'rgba(0, 128, 128, 0.3)'; // Teal for grouped
      }

      const content = sub.text;

      if (r) {
        // Use setOptions for start/end to ensure the UI updates reliably.
        // Direct assignment might not always trigger a redraw in some scenarios.
        r.setOptions({
          start: sub.startTime,
          end: sub.endTime,
          drag: !(sub.status === 'locked' || sub.status === 'ignored'),
          resize: !(sub.status === 'locked' || sub.status === 'ignored'),
          color,
          content
        });

        // Update CSS classes based on selection and grouping
        if (selectedRegionsRef.current.has(idStr)) {
          r.element.classList.add('selected');
        } else {
          r.element.classList.remove('selected');
        }

        if (sub.groupId) {
          r.element.classList.add('grouped');
        } else {
          r.element.classList.remove('grouped');
        }
      } else {
        // Double-check that regionsPlugin is still valid before adding region
        if (regionsPlugin && typeof regionsPlugin.addRegion === 'function') {
          const newRegion = wsRegions.current.addRegion({
            id: idStr,
            start: sub.startTime,
            end: sub.endTime,
            content,
            color,
            drag: !(sub.status === 'locked' || sub.status === 'ignored'),
            resize: !(sub.status === 'locked' || sub.status === 'ignored'),
          });

          // Apply CSS classes based on selection and grouping
          if (selectedRegionsRef.current.has(idStr)) {
            newRegion.element.classList.add('selected');
          }

          if (sub.groupId) {
            newRegion.element.classList.add('grouped');
          }
        }
      }
    });

    existingRegions.forEach((r, id) => {
      if (!processedIds.has(id)) {
        r.remove();
      }
    });

    isSyncingSubtitles.current = false;

  }, [subtitleLines, isReady, regionsHidden, selectedRegions]);

  const handleZoomIn = () => setZoom((prev: number) => Math.min(prev + 20, 500));
  const handleZoomOut = () => setZoom((prev: number) => Math.max(prev - 20, 10));

  return (
    <div className="h-full w-full flex flex-col relative group select-none bg-slate-900/50">
      {!isReady && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm text-slate-400 text-xs">
          {videoElement && <Activity className="animate-pulse mr-2" size={16}/>}
          {videoElement === null ? 'No Video Loaded' : 'Loading Audio Track...'}
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

      {/* 波形容器 */}
      <div ref={waveformContainerRef} className="w-full h-[160px]"/>

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
        .wavesurfer-region.selected {
          background-color: rgba(255, 165, 0, 0.4) !important; /* Orange for selected */
          border: 2px solid rgba(255, 165, 0, 0.8) !important;
        }
        .wavesurfer-region.grouped {
          background-color: rgba(0, 128, 128, 0.3) !important; /* Teal for grouped */
          border: 2px solid rgba(0, 128, 128, 0.8) !important;
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