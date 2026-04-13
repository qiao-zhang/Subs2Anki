import {renderHook, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {mockState, useAppStoreMock, extractAudioClipMock, storeMediaMock} = vi.hoisted(() => {
  const state = {
    ankiCards: [] as Array<{id: string; subtitleId: number; audioStatus?: string}>,
    audioVolume: 1.5,
    getSubtitleLine: vi.fn((subtitleId: number) => {
      if (subtitleId === 1) return {id: 1, startTime: 1, endTime: 2, text: 'line', status: 'normal' as const};
      return null;
    }),
    updateCardAudioStatus: vi.fn(),
  };

  const storeMock = vi.fn((selector: (innerState: typeof state) => unknown) => selector(state));
  (storeMock as typeof storeMock & {getState: () => typeof state}).getState = () => state;

  return {
    mockState: state,
    useAppStoreMock: storeMock,
    extractAudioClipMock: vi.fn(async () => new Blob(['audio'], {type: 'audio/wav'})),
    storeMediaMock: vi.fn(async () => undefined),
  };
});

vi.mock('../../services/store.ts', () => ({
  useAppStore: useAppStoreMock,
}));

vi.mock('../../services/ffmpeg.ts', () => ({
  ffmpegService: {
    extractAudioClip: extractAudioClipMock,
  },
}));

vi.mock('../../services/db.ts', () => ({
  storeMedia: storeMediaMock,
}));

import {useMediaProcessing} from '../../hooks/useMediaProcessing.ts';

describe('useMediaProcessing', () => {
  beforeEach(() => {
    mockState.ankiCards = [];
    mockState.audioVolume = 1.5;
    mockState.getSubtitleLine.mockClear();
    mockState.updateCardAudioStatus.mockClear();
    extractAudioClipMock.mockClear();
    storeMediaMock.mockClear();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
  });

  it('prioritizes preview card audio processing and marks done', async () => {
    mockState.ankiCards = [
      {id: 'card-1', subtitleId: 1, audioStatus: 'pending'},
      {id: 'card-2', subtitleId: 1, audioStatus: 'pending'},
    ];

    const videoFile = new File(['video'], 'demo.mp4', {type: 'video/mp4'});

    renderHook(() => useMediaProcessing(videoFile, {
      id: 'card-1',
      subtitleId: 1,
      text: 'line',
      translation: '',
      notes: '',
      screenshotRef: null,
      audioRef: null,
      timestampStr: '00:01',
      audioStatus: 'pending',
    }));

    await waitFor(() => {
      expect(extractAudioClipMock).toHaveBeenCalledWith(videoFile, 1, 2, 1.5);
    });

    expect(mockState.updateCardAudioStatus).toHaveBeenCalledWith('card-1', 'processing');
    expect(mockState.updateCardAudioStatus).toHaveBeenCalledWith('card-1', 'done', '00000000-0000-4000-8000-000000000001');
    expect(storeMediaMock).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001', expect.any(Blob));
  });

  it('marks error when subtitle line is missing', async () => {
    mockState.ankiCards = [{id: 'card-missing', subtitleId: 999, audioStatus: 'pending'}];

    const videoFile = new File(['video'], 'demo.mp4', {type: 'video/mp4'});

    renderHook(() => useMediaProcessing(videoFile, null));

    await waitFor(() => {
      expect(mockState.updateCardAudioStatus).toHaveBeenCalledWith('card-missing', 'error');
    });

    expect(extractAudioClipMock).not.toHaveBeenCalled();
  });
});




