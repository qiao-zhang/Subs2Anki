/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useDesktopFfmpegStatus } from '@/hooks/useDesktopFfmpegStatus.ts';
import { useAppStore } from '@/services/store.ts';
import type { AnkiCard } from '@/services/types.ts';

const mocks = vi.hoisted(() => ({
  getAvailability: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
  }),
}));

vi.mock('@/services/ffmpeg.ts', () => ({
  ffmpegService: {
    getAvailability: mocks.getAvailability,
    prepareVideoSource: vi.fn(),
    extractAudioClip: vi.fn(),
  },
}));

const makeCard = (overrides: Partial<AnkiCard> = {}): AnkiCard => ({
  id: 'card-1',
  subtitleId: 1,
  text: 'Subtitle',
  translation: '',
  notes: '',
  screenshotRef: null,
  audioRef: null,
  timestampStr: '00:01',
  audioStatus: 'pending',
  syncStatus: 'unsynced',
  ...overrides,
});

function Probe({ showNotification }: { showNotification: (text: string) => void }) {
  const {
    desktopFfmpegMessage,
    isDesktopFfmpegAvailable,
    refreshDesktopFfmpegStatus,
  } = useDesktopFfmpegStatus({ showNotification });

  return (
    <div>
      <span data-testid="available">{String(isDesktopFfmpegAvailable)}</span>
      <span data-testid="message">{desktopFfmpegMessage ?? ''}</span>
      <button type="button" onClick={() => void refreshDesktopFfmpegStatus(true)}>refresh</button>
    </div>
  );
}

describe('useDesktopFfmpegStatus', () => {
  beforeEach(() => {
    vi.stubGlobal('__TAURI_BUILD__', true);
    useAppStore.setState(useAppStore.getInitialState());
    mocks.getAvailability.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('marks pending cards as ffmpeg_unavailable when the startup probe fails', async () => {
    mocks.getAvailability.mockResolvedValue({
      available: false,
      message: 'FFmpeg missing',
      binaryPath: null,
      targetTriple: 'x86_64-pc-windows-msvc',
    });

    useAppStore.setState({ ankiCards: [makeCard()] });
    render(<Probe showNotification={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('message').textContent).toBe('FFmpeg missing');
      const [card] = useAppStore.getState().ankiCards;
      expect(card.audioStatus).toBe('error');
      expect(card.audioErrorReason).toBe('ffmpeg_unavailable');
    });
  });

  it('retries ffmpeg_unavailable cards after a successful re-check', async () => {
    const notify = vi.fn();
    mocks.getAvailability
      .mockResolvedValueOnce({
        available: false,
        message: 'FFmpeg missing',
        binaryPath: null,
        targetTriple: 'x86_64-pc-windows-msvc',
      })
      .mockResolvedValueOnce({
        available: true,
        message: 'ffmpeg version 7.0',
        binaryPath: 'C:/ffmpeg/ffmpeg.exe',
        targetTriple: 'x86_64-pc-windows-msvc',
      });

    useAppStore.setState({
      ankiCards: [makeCard({ audioStatus: 'error', audioErrorReason: 'ffmpeg_unavailable' })],
    });

    render(<Probe showNotification={notify} />);

    await waitFor(() => {
      expect(screen.getByTestId('message').textContent).toBe('FFmpeg missing');
    });

    fireEvent.click(screen.getByText('refresh'));

    await waitFor(() => {
      expect(screen.getByTestId('available').textContent).toBe('true');
    });

    const [card] = useAppStore.getState().ankiCards;
    expect(card.audioStatus).toBe('pending');
    expect(card.audioErrorReason).toBeUndefined();
    expect(notify).toHaveBeenCalledWith('Desktop FFmpeg is ready');
  });
});
