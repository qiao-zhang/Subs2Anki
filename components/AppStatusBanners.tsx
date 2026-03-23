import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FfmpegAvailability } from '@/services/ffmpeg-contract.ts';

interface AppStatusBannersProps {
  desktopFfmpegMessage: string | null;
  desktopFfmpegStatus: FfmpegAvailability | null;
  isDesktopFfmpegCheckPending: boolean;
}

const AppStatusBanners: React.FC<AppStatusBannersProps> = ({
  desktopFfmpegMessage,
  desktopFfmpegStatus,
  isDesktopFfmpegCheckPending,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {desktopFfmpegMessage && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-700/60 bg-amber-950/80 px-4 py-3 text-sm text-amber-100 shadow-lg z-40">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-300"/>
            <div>
              <div className="font-semibold">
                {t('modals.desktopFfmpegUnavailable', { defaultValue: 'Desktop FFmpeg is unavailable' })}
              </div>
              <div className="mt-1 text-amber-100/90">{desktopFfmpegMessage}</div>
              {desktopFfmpegStatus?.binaryPath && (
                <div className="mt-1 text-xs text-amber-200/80 break-all">{desktopFfmpegStatus.binaryPath}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isDesktopFfmpegCheckPending && (
        <div className="mx-4 mt-3 rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-slate-200 shadow-lg z-40">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-slate-300"/>
            <div>
              <div className="font-semibold">
                {t('modals.checkingDesktopFfmpeg', { defaultValue: 'Checking desktop FFmpeg availability...' })}
              </div>
              <div className="mt-1 text-slate-400">
                {t('modals.desktopFfmpegCheckDescription', {
                  defaultValue: 'Audio extraction will be enabled automatically once the desktop FFmpeg check completes.',
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppStatusBanners;
