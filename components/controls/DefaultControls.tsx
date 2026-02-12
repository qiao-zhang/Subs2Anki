import React from 'react';
import {Video as VideoIcon, Camera} from 'lucide-react';
import {formatTimestamp} from '@/services/time.ts';
import {BTN_BASE, BTN_SECONDARY} from '@/services/shared-styles.ts';
import { useTranslation } from 'react-i18next';

interface DefaultControlsProps {
  videoName: string;
  currentTime: number;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCaptureFrame: () => void;
}

const DefaultControls: React.FC<DefaultControlsProps> = ({
                                                           videoName,
                                                           currentTime,
                                                           onVideoUpload,
                                                           onCaptureFrame,
                                                         }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between w-full relative h-[42px]">

      {/* Left: Video Selector */}
      <div className="flex items-center gap-2 z-10">
        <label className={`${BTN_BASE} h-9 ${BTN_SECONDARY} cursor-pointer max-w-[240px]`}>
          <VideoIcon size={16} className="shrink-0"/>
          <span className="truncate">{videoName || t("uploadVideo")}</span>
          <input type="file" accept="video/*" onChange={onVideoUpload} className="hidden"/>
        </label>
      </div>

      {/* Center: Time Display */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none pointer-events-none">
        <div className="font-mono text-xl text-indigo-400 font-bold tracking-widest">
          {formatTimestamp(currentTime, 'trim')}
        </div>
      </div>

      {/* Right: Global Tools */}
      <div className="flex items-center gap-2 z-10">
        <button
          onClick={onCaptureFrame}
          className={`${BTN_BASE} h-9 ${BTN_SECONDARY} px-2.5 ${videoName === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={t("captureFrame")}
          disabled={videoName === ''}
        >
          <Camera size={16}/> {t("captureFrame")}
        </button>
      </div>

    </div>
  );
};

export default DefaultControls;
