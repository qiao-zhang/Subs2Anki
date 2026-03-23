/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useCardCreationFlow } from '@/hooks/useCardCreationFlow.ts';
import type { FfmpegAvailability } from '@/services/ffmpeg-contract.ts';
import type { SubtitleLine } from '@/services/types.ts';

const mocks = vi.hoisted(() => ({
  convert: vi.fn(),
  storeMedia: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; num?: number }) => {
      if (_key === 'notifications.cardCreated') {
        return `Created ${options?.num} card(s)`;
      }
      return options?.defaultValue ?? _key;
    },
  }),
}));

vi.mock('@/services/furigana.ts', () => ({
  furiganaService: {
    convert: mocks.convert,
  },
}));

vi.mock('@/services/db.ts', () => ({
  storeMedia: mocks.storeMedia,
}));

const subtitleLine: SubtitleLine = {
  id: 1,
  startTime: 1.2,
  endTime: 2.4,
  text: '字幕テキスト',
  status: 'normal',
};

function Probe(props: {
  subtitleLines?: SubtitleLine[];
  desktopFfmpegStatus?: FfmpegAvailability | null;
  desktopFfmpegMessage?: string | null;
  getSubtitleLine?: (id: number) => SubtitleLine | undefined;
  captureFrameAt?: (time: number) => Promise<string | null>;
  addCard?: (card: any) => void;
  setSubtitleLineStatus?: (id: number, status: SubtitleLine['status']) => void;
  showNotification?: (text: string) => void;
  bulkCreateLimit?: number;
}) {
  const hook = useCardCreationFlow({
    subtitleLines: props.subtitleLines ?? [subtitleLine],
    projectName: 'Lesson 1',
    globalTags: ['tag-a'],
    bulkCreateLimit: props.bulkCreateLimit ?? 10,
    desktopFfmpegStatus: props.desktopFfmpegStatus ?? {
      available: true,
      message: 'ffmpeg ready',
      binaryPath: null,
    },
    desktopFfmpegMessage: props.desktopFfmpegMessage ?? null,
    getSubtitleLine: props.getSubtitleLine ?? ((id) => (id === 1 ? subtitleLine : undefined)),
    getVideoPlayerHandle: () => ({
      captureFrameAt: props.captureFrameAt ?? vi.fn(async () => 'data:image/jpeg;base64,abc'),
    } as any),
    addCard: props.addCard ?? vi.fn(),
    setSubtitleLineStatus: props.setSubtitleLineStatus ?? vi.fn(),
    showNotification: props.showNotification ?? vi.fn(),
  });

  return (
    <div>
      <span data-testid="bulk-progress">{`${hook.bulkCreateProgress.current}/${hook.bulkCreateProgress.total}`}</span>
      <span data-testid="is-bulk-creating">{String(hook.isBulkCreating)}</span>
      <button type="button" onClick={() => void hook.handleCreateCard(1)}>create-one</button>
      <button type="button" onClick={() => void hook.handleBulkCreateCards()}>create-many</button>
      <button type="button" onClick={hook.resetBulkCreationState}>reset-bulk</button>
    </div>
  );
}

describe('useCardCreationFlow', () => {
  beforeEach(() => {
    mocks.convert.mockReset();
    mocks.storeMedia.mockReset();
    mocks.convert.mockResolvedValue('<ruby>字幕</ruby>');
    mocks.storeMedia.mockResolvedValue(undefined);
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'media-uuid') } as unknown as Crypto);
    vi.stubGlobal('__TAURI_BUILD__', true);
  });

  afterEach(() => {
    cleanup();
  });

  it('creates a card, stores the screenshot, and locks the subtitle', async () => {
    const addCard = vi.fn();
    const setSubtitleLineStatus = vi.fn();

    render(<Probe addCard={addCard} setSubtitleLineStatus={setSubtitleLineStatus} />);
    fireEvent.click(screen.getByText('create-one'));

    await waitFor(() => {
      expect(addCard).toHaveBeenCalledOnce();
    });

    expect(mocks.storeMedia).toHaveBeenCalledWith('media-uuid', 'data:image/jpeg;base64,abc');
    expect(setSubtitleLineStatus).toHaveBeenCalledWith(1, 'locked');
    expect(addCard.mock.calls[0][0]).toMatchObject({
      subtitleId: 1,
      tags: ['tag-a'],
      audioStatus: 'pending',
      audioErrorReason: undefined,
      screenshotRef: 'media-uuid',
    });
  });

  it('creates cards with ffmpeg_unavailable when desktop ffmpeg is unavailable', async () => {
    const addCard = vi.fn();
    const showNotification = vi.fn();

    render(
      <Probe
        addCard={addCard}
        desktopFfmpegStatus={{
          available: false,
          message: 'Desktop FFmpeg is unavailable',
          binaryPath: null,
        }}
        desktopFfmpegMessage="Desktop FFmpeg is unavailable"
        showNotification={showNotification}
      />,
    );
    fireEvent.click(screen.getByText('create-one'));

    await waitFor(() => {
      expect(addCard).toHaveBeenCalledOnce();
    });

    expect(showNotification).toHaveBeenCalledWith('Desktop FFmpeg is unavailable');
    expect(addCard.mock.calls[0][0]).toMatchObject({
      audioStatus: 'error',
      audioErrorReason: 'ffmpeg_unavailable',
    });
  });

  it('shows a no-lines notification and skips bulk mode when nothing is eligible', async () => {
    const showNotification = vi.fn();

    render(
      <Probe
        subtitleLines={[{ ...subtitleLine, status: 'locked' }]}
        getSubtitleLine={() => undefined}
        showNotification={showNotification}
      />,
    );
    fireEvent.click(screen.getByText('create-many'));

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith('No subtitle lines to make cards');
    });

    expect(screen.getByTestId('is-bulk-creating').textContent).toBe('false');
    expect(screen.getByTestId('bulk-progress').textContent).toBe('0/0');
  });

  it('tracks bulk progress and reports the limited created count', async () => {
    const addCard = vi.fn();
    const showNotification = vi.fn();
    const subtitleLines = [subtitleLine, { ...subtitleLine, id: 2, text: '第二行' }];

    render(
      <Probe
        subtitleLines={subtitleLines}
        getSubtitleLine={(id) => subtitleLines.find(item => item.id === id)}
        bulkCreateLimit={1}
        addCard={addCard}
        showNotification={showNotification}
      />,
    );
    fireEvent.click(screen.getByText('create-many'));

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith('Created 1 card(s)');
    });

    expect(addCard).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('bulk-progress').textContent).toBe('1/1');
  });

  it('blocks overlapping create actions while creation is in progress', async () => {
    const addCard = vi.fn();
    const showNotification = vi.fn();
    let releaseCapture: (() => void) | null = null;
    const slowCapture = vi.fn(() => new Promise<string>((resolve) => {
      releaseCapture = () => resolve('data:image/jpeg;base64,abc');
    }));

    render(
      <Probe
        addCard={addCard}
        showNotification={showNotification}
        captureFrameAt={slowCapture}
      />,
    );

    fireEvent.click(screen.getByText('create-many'));
    fireEvent.click(screen.getByText('create-one'));

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith('Creating cards is already in progress.');
    });

    releaseCapture?.();
    await waitFor(() => {
      expect(addCard).toHaveBeenCalledTimes(1);
    });
  });
});

