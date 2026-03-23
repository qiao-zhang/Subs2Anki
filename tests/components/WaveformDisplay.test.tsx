/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WaveformDisplay from '../../components/WaveformDisplay.tsx';
import { useAppStore } from '@/services/store.ts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      if (options?.defaultValue) return options.defaultValue;
      if (key === 'modals.noVideoLoaded') return 'No video loaded';
      return key;
    },
  }),
}));

vi.mock('@/hooks/useKeyboardShortcuts.tsx', () => ({
  useMergeKeyboardShortcut: vi.fn(),
}));

vi.mock('@/services/store.ts', () => ({
  useAppStore: vi.fn(),
}));

describe('WaveformDisplay', () => {
  const defaultProps = {
    videoElement: null,
    videoSrc: '',
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
    vi.mocked(useAppStore).mockImplementation((selector: any) => selector({
      subtitleLines: [],
      getSubtitleLine: vi.fn(),
      breakUpSubtitleLine: vi.fn(),
      countSubtitleLinesBefore: vi.fn(() => 0),
    }));
  });

  it('shows the empty-state overlay when no video is loaded', () => {
    render(<WaveformDisplay {...defaultProps} />);

    expect(screen.getByText('No video loaded')).toBeTruthy();
  });

  it('renders waveform chrome even before the audio track is ready', () => {
    const { container } = render(<WaveformDisplay {...defaultProps} />);

    const root = container.firstElementChild as HTMLDivElement | null;
    expect(root?.className.includes('bg-slate-900/50')).toBe(true);
    expect(container.innerHTML.includes('h-[160px]')).toBe(true);
  });
});