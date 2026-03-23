/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useProjectReset } from '@/hooks/useProjectReset.ts';
import type { AnkiCard } from '@/services/types.ts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
  }),
}));

const makeCard = (id: string): AnkiCard => ({
  id,
  subtitleId: 1,
  text: 'Subtitle',
  translation: '',
  notes: '',
  screenshotRef: `${id}-shot`,
  audioRef: `${id}-audio`,
  timestampStr: '00:01',
  audioStatus: 'done',
  syncStatus: 'unsynced',
});

function Probe(props: Partial<Parameters<typeof useProjectReset>[0]>) {
  const hook = useProjectReset({
    ankiCards: props.ankiCards ?? [makeCard('card-1'), makeCard('card-2')],
    setProjectName: props.setProjectName ?? vi.fn(),
    resetVideo: props.resetVideo ?? vi.fn(),
    setSubtitles: props.setSubtitles ?? vi.fn(),
    setHasUnsavedChanges: props.setHasUnsavedChanges ?? vi.fn(),
    clearCards: props.clearCards ?? vi.fn(),
    setSelectedDeck: props.setSelectedDeck ?? vi.fn(),
    setGlobalTags: props.setGlobalTags ?? vi.fn(),
    deleteScreenshotAndAudioForCard: props.deleteScreenshotAndAudioForCard ?? vi.fn(async () => {}),
    resetUiState: props.resetUiState ?? vi.fn(),
    resetProcessingState: props.resetProcessingState ?? vi.fn(),
    resetVideoPlayerState: props.resetVideoPlayerState ?? vi.fn(),
    closeTransientUi: props.closeTransientUi ?? vi.fn(),
    showNotification: props.showNotification ?? vi.fn(),
    reloadPage: props.reloadPage ?? vi.fn(),
  });

  return <button onClick={hook.handleResetProject}>reset</button>;
}

describe('useProjectReset', () => {
  beforeEach(() => {
    vi.stubGlobal('__TAURI_BUILD__', true);
  });

  afterEach(() => {
    cleanup();
  });

  it('resets project state, clears cards, and reloads the page', () => {
    const setProjectName = vi.fn();
    const resetVideo = vi.fn();
    const setSubtitles = vi.fn();
    const setHasUnsavedChanges = vi.fn();
    const clearCards = vi.fn();
    const setSelectedDeck = vi.fn();
    const setGlobalTags = vi.fn();
    const deleteScreenshotAndAudioForCard = vi.fn(async () => {});
    const resetUiState = vi.fn();
    const resetProcessingState = vi.fn();
    const resetVideoPlayerState = vi.fn();
    const closeTransientUi = vi.fn();
    const showNotification = vi.fn();
    const reloadPage = vi.fn();

    render(
      <Probe
        setProjectName={setProjectName}
        resetVideo={resetVideo}
        setSubtitles={setSubtitles}
        setHasUnsavedChanges={setHasUnsavedChanges}
        clearCards={clearCards}
        setSelectedDeck={setSelectedDeck}
        setGlobalTags={setGlobalTags}
        deleteScreenshotAndAudioForCard={deleteScreenshotAndAudioForCard}
        resetUiState={resetUiState}
        resetProcessingState={resetProcessingState}
        resetVideoPlayerState={resetVideoPlayerState}
        closeTransientUi={closeTransientUi}
        showNotification={showNotification}
        reloadPage={reloadPage}
      />,
    );

    fireEvent.click(screen.getByText('reset'));

    expect(setProjectName).toHaveBeenCalledWith('');
    expect(resetVideo).toHaveBeenCalledOnce();
    expect(setSubtitles).toHaveBeenCalledWith([], '', null, null);
    expect(setHasUnsavedChanges).toHaveBeenCalledWith(false);
    expect(resetUiState).toHaveBeenCalledOnce();
    expect(resetProcessingState).toHaveBeenCalledOnce();
    expect(resetVideoPlayerState).toHaveBeenCalledOnce();
    expect(deleteScreenshotAndAudioForCard).toHaveBeenNthCalledWith(1, 'card-1');
    expect(deleteScreenshotAndAudioForCard).toHaveBeenNthCalledWith(2, 'card-2');
    expect(clearCards).toHaveBeenCalledOnce();
    expect(setSelectedDeck).toHaveBeenCalledWith('Subs2Anki Export');
    expect(setGlobalTags).toHaveBeenCalledWith([]);
    expect(closeTransientUi).toHaveBeenCalledOnce();
    expect(reloadPage).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith('Project has been reset');
  });
});

