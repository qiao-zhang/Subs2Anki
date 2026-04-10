import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {useRef} from 'react';
import {SubtitleLine} from '@/services/types.ts';
import {useCardActions} from '@/hooks/app/useCardActions.ts';

describe('useCardActions', () => {
  it('creates card and locks subtitle line', async () => {
    const subtitle: SubtitleLine = {id: 1, startTime: 1, endTime: 2, text: 'hello', status: 'normal'};
    const addCard = vi.fn();
    const setSubtitleLineStatus = vi.fn();

    const {result} = renderHook(() => {
      const videoPlayerRef = useRef({captureFrameAt: vi.fn(async () => null)} as any);
      return useCardActions({
        projectName: 'Proj',
        globalTags: ['tag1'],
        bulkCreateLimit: 10,
        subtitleLines: [subtitle],
        getSubtitleLine: (id) => (id === 1 ? subtitle : null),
        addCard,
        setSubtitleLineStatus,
        ankiCards: [],
        deleteCard: vi.fn(),
        showNotification: vi.fn(),
        t: (k) => k,
        videoPlayerRef,
      });
    });

    await act(async () => {
      await result.current.handleCreateCard(1);
    });

    expect(addCard).toHaveBeenCalledTimes(1);
    expect(setSubtitleLineStatus).toHaveBeenCalledWith(1, 'locked');
  });

  it('shows notification when bulk create has no normal subtitle lines', async () => {
    const showNotification = vi.fn();

    const {result} = renderHook(() => {
      const videoPlayerRef = useRef({captureFrameAt: vi.fn(async () => null)} as any);
      return useCardActions({
        projectName: 'Proj',
        globalTags: [],
        bulkCreateLimit: 10,
        subtitleLines: [{id: 1, startTime: 0, endTime: 1, text: 'x', status: 'locked'}],
        getSubtitleLine: () => null,
        addCard: vi.fn(),
        setSubtitleLineStatus: vi.fn(),
        ankiCards: [],
        deleteCard: vi.fn(),
        showNotification,
        t: (k) => k,
        videoPlayerRef,
      });
    });

    await act(async () => {
      await result.current.handleBulkCreateCards();
    });

    expect(showNotification).toHaveBeenCalled();
  });
});

