import React from 'react';
import {render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import WaveSurfer from 'wavesurfer.js';
import WaveformDisplay from '../../components/WaveformDisplay.tsx';

const {mockStoreState, useAppStoreMock, mockWaveSurferInstance, mockRegionsPlugin} = vi.hoisted(() => {
  const state = {
    subtitleLines: [
      {id: 1, startTime: 0, endTime: 2, text: 'Test subtitle 1', status: 'normal' as const},
      {id: 2, startTime: 3, endTime: 5, text: 'Test subtitle 2', status: 'normal' as const},
    ],
    getSubtitleLine: vi.fn((id: number) => state.subtitleLines.find((subtitle) => subtitle.id === id) ?? null),
    breakUpSubtitleLine: vi.fn(),
    countSubtitleLinesBefore: vi.fn(() => 0),
    mergeSubtitleLines: vi.fn(),
  };

  const storeMock = vi.fn((selector: (mockState: typeof state) => unknown) => selector(state));
  (storeMock as typeof storeMock & {getState: () => typeof state}).getState = () => state;

  return {
    mockStoreState: state,
    useAppStoreMock: storeMock,
    mockWaveSurferInstance: {
      on: vi.fn(),
      destroy: vi.fn(),
      zoom: vi.fn(),
      getMediaElement: vi.fn(() => null),
      getCurrentTime: vi.fn(() => 0),
    },
    mockRegionsPlugin: {
      enableDragSelection: vi.fn(),
      on: vi.fn(),
      addRegion: vi.fn(),
      getRegions: vi.fn(() => []),
    },
  };
});

vi.mock('../../services/store.ts', () => ({
  useAppStore: useAppStoreMock,
}));

vi.mock('../../hooks/useKeyboardShortcuts.tsx', () => ({
  useMergeKeyboardShortcut: vi.fn(),
}));

vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(() => mockWaveSurferInstance),
  },
}));

vi.mock('wavesurfer.js/dist/plugins/regions.esm.js', () => ({
  default: {
    create: vi.fn(() => mockRegionsPlugin),
  },
}));

vi.mock('wavesurfer.js/dist/plugins/minimap.esm.js', () => ({
  default: {
    create: vi.fn(() => ({})),
  },
}));

vi.mock('wavesurfer.js/dist/plugins/timeline.esm.js', () => ({
  default: {
    create: vi.fn(() => ({})),
  },
}));

describe('WaveformDisplay', () => {
  const defaultProps = {
    videoElement: null,
    videoSrc: 'test-video.mp4',
    currentTime: 0,
    onSeek: vi.fn(),
    regionsHidden: false,
    tempSubtitleLine: null,
    onTempSubtitleLineCreated: vi.fn(),
    onTempSubtitleLineUpdated: vi.fn(),
    onTempSubtitleLineClicked: vi.fn(),
    onTempSubtitleLineRemoved: vi.fn(),
    onSubtitleLineClicked: vi.fn(),
    onSubtitleLineShiftClicked: vi.fn(),
    onSubtitleLineUpdated: vi.fn(),
    onSubtitleLineRemoved: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty-state loading overlay when no video is loaded', () => {
    const {container} = render(<WaveformDisplay {...defaultProps} />);

    expect(screen.getByText('modals.noVideoLoaded')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('bg-slate-900/50');
    expect(container.querySelector('[class*="h-[160px]"]')).toBeInTheDocument();
  });

  it('initializes WaveSurfer with the provided video element', () => {
    const videoElement = document.createElement('video');

    render(<WaveformDisplay {...defaultProps} videoElement={videoElement} />);

    expect(WaveSurfer.create).toHaveBeenCalledTimes(1);
    expect(WaveSurfer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        media: videoElement,
      })
    );
    expect(mockRegionsPlugin.enableDragSelection).toHaveBeenCalledTimes(1);
  });
});