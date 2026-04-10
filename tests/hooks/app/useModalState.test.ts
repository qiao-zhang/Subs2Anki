import {act, renderHook} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {useModalState} from '@/hooks/app/useModalState.ts';

describe('useModalState', () => {
  it('manages template/settings/shortcuts modal flags', () => {
    const {result} = renderHook(() => useModalState());

    expect(result.current.isTemplateModalOpen).toBe(false);
    expect(result.current.isSettingsModalOpen).toBe(false);
    expect(result.current.isShortcutsModalOpen).toBe(false);

    act(() => {
      result.current.setIsTemplateModalOpen(true);
      result.current.setIsSettingsModalOpen(true);
      result.current.setIsShortcutsModalOpen(true);
    });

    expect(result.current.isTemplateModalOpen).toBe(true);
    expect(result.current.isSettingsModalOpen).toBe(true);
    expect(result.current.isShortcutsModalOpen).toBe(true);
  });

  it('stores and clears preview card', () => {
    const {result} = renderHook(() => useModalState());

    act(() => {
      result.current.setPreviewCard({
        id: 'c1',
        subtitleId: 1,
        text: 't',
        translation: '',
        notes: '',
        furigana: '',
        tags: [],
        screenshotRef: null,
        audioRef: null,
        audioStatus: 'pending',
        timestampStr: '00:00',
        syncStatus: 'unsynced',
      });
    });

    expect(result.current.previewCard?.id).toBe('c1');

    act(() => {
      result.current.setPreviewCard(null);
    });

    expect(result.current.previewCard).toBeNull();
  });
});

