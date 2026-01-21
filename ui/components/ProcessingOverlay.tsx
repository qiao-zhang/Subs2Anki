import React from 'react';
import {useAppStore} from '@/core/store.ts';
import {Loader2} from 'lucide-react';

interface ProcessingOverlayProps {
  isExporting: boolean;
  isSyncing: boolean;
  syncProgress: { current: number, total: number };
  setIsExporting: (exporting: boolean) => void;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  isExporting,
  isSyncing,
  syncProgress,
  setIsExporting
}) => {
  const { ankiCards } = useAppStore();

  if (!(isExporting || isSyncing)) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center select-none animate-in fade-in duration-300">
      <Loader2 size={48} className="text-indigo-500 animate-spin mb-4"/>
      <div className="text-xl font-bold text-white">
        {isSyncing ? `Syncing to Anki...` : "Preparing Export..."}
      </div>
      <div className="text-sm text-slate-400 mt-2">
        {isSyncing ? `Card ${syncProgress.current} of ${syncProgress.total}` :
          `Processing media (${ankiCards.filter(c => c.audioStatus !== 'done').length} remaining)`}
      </div>
      {!isSyncing && (
        <button
          onClick={() => setIsExporting(false)}
          className="mt-6 px-4 py-2 border border-slate-600 rounded text-slate-400 hover:bg-slate-800 transition"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default ProcessingOverlay;