import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ffmpegService } from '@/services/ffmpeg.ts';
import type { FfmpegAvailability } from '@/services/ffmpeg-contract.ts';
import { useAppStore } from '@/services/store.ts';

interface UseDesktopFfmpegStatusOptions {
  showNotification: (text: string) => void;
}

interface UseDesktopFfmpegStatusResult {
  desktopFfmpegStatus: FfmpegAvailability | null;
  isDesktopFfmpegCheckPending: boolean;
  isDesktopFfmpegAvailable: boolean;
  desktopFfmpegMessage: string | null;
  refreshDesktopFfmpegStatus: (showResultToast?: boolean) => Promise<void>;
  ensureDesktopFfmpegReady: (showUi?: boolean) => boolean;
}

export const useDesktopFfmpegStatus = ({
  showNotification,
}: UseDesktopFfmpegStatusOptions): UseDesktopFfmpegStatusResult => {
  const { t } = useTranslation();
  const updateCardAudioStatus = useAppStore(state => state.updateCardAudioStatus);
  const retryCardsBlockedByFfmpeg = useAppStore(state => state.retryCardsBlockedByFfmpeg);
  const [desktopFfmpegStatus, setDesktopFfmpegStatus] = useState<FfmpegAvailability | null>(
    __TAURI_BUILD__ ? null : { available: true, message: 'Web mode uses FFmpeg.wasm.', binaryPath: null }
  );
  const startupProbeStartedRef = useRef(false);

  const refreshDesktopFfmpegStatus = useCallback(async (showResultToast: boolean = false) => {
    if (!__TAURI_BUILD__) {
      return;
    }

    setDesktopFfmpegStatus(null);
    try {
      const status = await ffmpegService.getAvailability(true);
      setDesktopFfmpegStatus(status);
      if (status.available) {
        retryCardsBlockedByFfmpeg();
      }
      if (showResultToast) {
        showNotification(
          status.available
            ? t('modals.desktopFfmpegReady', { defaultValue: 'Desktop FFmpeg is ready' })
            : status.message
        );
      }
    } catch (error) {
      const fallbackStatus = {
        available: false,
        message: `Desktop FFmpeg check failed: ${(error as Error).message}`,
        binaryPath: null,
        targetTriple: undefined,
      } satisfies FfmpegAvailability;
      setDesktopFfmpegStatus(fallbackStatus);
      if (showResultToast) {
        showNotification(fallbackStatus.message);
      }
    }
  }, [retryCardsBlockedByFfmpeg, showNotification, t]);

  useEffect(() => {
    if (!__TAURI_BUILD__ || startupProbeStartedRef.current) {
      return;
    }

    startupProbeStartedRef.current = true;
    refreshDesktopFfmpegStatus(false);
  }, [refreshDesktopFfmpegStatus]);

  const isDesktopFfmpegCheckPending = __TAURI_BUILD__ && desktopFfmpegStatus === null;
  const isDesktopFfmpegAvailable = !__TAURI_BUILD__ || desktopFfmpegStatus?.available === true;
  const desktopFfmpegMessage = __TAURI_BUILD__ && desktopFfmpegStatus && !desktopFfmpegStatus.available
    ? desktopFfmpegStatus.message
    : null;

  useEffect(() => {
    if (!desktopFfmpegMessage) {
      return;
    }

    const currentCards = useAppStore.getState().ankiCards;
    currentCards
      .filter(card => card.audioStatus === 'pending' || card.audioStatus === 'processing')
      .forEach(card => updateCardAudioStatus(card.id, 'error', undefined, 'ffmpeg_unavailable'));
  }, [desktopFfmpegMessage, updateCardAudioStatus]);

  const ensureDesktopFfmpegReady = useCallback((showUi: boolean = true) => {
    if (!__TAURI_BUILD__) {
      return true;
    }

    if (desktopFfmpegStatus === null) {
      if (showUi) {
        showNotification(t('modals.checkingDesktopFfmpeg', { defaultValue: 'Checking desktop FFmpeg availability...' }));
      }
      return false;
    }

    if (desktopFfmpegStatus.available) {
      return true;
    }

    if (showUi && desktopFfmpegMessage) {
      showNotification(desktopFfmpegMessage);
    }

    return false;
  }, [desktopFfmpegMessage, desktopFfmpegStatus, showNotification, t]);

  return {
    desktopFfmpegStatus,
    isDesktopFfmpegCheckPending,
    isDesktopFfmpegAvailable,
    desktopFfmpegMessage,
    refreshDesktopFfmpegStatus,
    ensureDesktopFfmpegReady,
  };
};
