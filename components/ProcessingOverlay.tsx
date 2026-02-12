import React from 'react';
import {Loader2} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProcessingOverlayProps {
  isInProcess: boolean;
  InProcessMessage?: string;
  Progress?: { current: number, total: number };
  onCancel?: () => void;
  children?: React.ReactNode;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
                                                               isInProcess,
                                                               InProcessMessage,
                                                               Progress,
                                                               onCancel,
                                                               children,
                                                             }) => {
  const { t } = useTranslation();
  if (!isInProcess) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center select-none animate-in fade-in duration-300">
      <Loader2 size={48} className="text-indigo-500 animate-spin mb-4"/>

      <div className="text-xl font-bold text-white">
        {InProcessMessage || t("modals.inProcess", { defaultValue: "In Process" })}
      </div>
      <div className="text-sm text-slate-400 mt-2">
        {children ? children :
          Progress ? t("modals.itemOfTotal", { defaultValue: "Item {{current}} of {{total}}", current: Progress.current, total: Progress.total }) : t("modals.processing", { defaultValue: "Processing..." })}
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-6 px-4 py-2 border border-slate-600 rounded text-slate-400 hover:bg-slate-800 transition"
        >
          {t("modals.cancel")}
        </button>
      )}
    </div>
  );
};

export default ProcessingOverlay;