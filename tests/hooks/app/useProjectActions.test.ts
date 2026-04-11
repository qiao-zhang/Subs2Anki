import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {useProjectActions} from '../../../hooks/app/useProjectActions.ts';

describe('useProjectActions', () => {
  it('loads project and restores selected deck', async () => {
    const setSelectedDeck = vi.fn();
    const setScreenshotTimingPercent = vi.fn();
    const loadProjectRecordFn = vi.fn(async () => ({
      projectName: 'Proj',
      subtitleLines: [],
      subtitleFileName: 'a.srt',
      ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
      ankiConnectUrl: 'http://localhost:8765',
      selectedDeck: 'DeckX',
      globalTags: ['tag1'],
      screenshotTimingPercent: 75,
    }));

    const {result} = renderHook(() =>
      useProjectActions({
        projectName: 'Proj',
        videoName: 'v.mp4',
        subtitleFileName: 'a.srt',
        subtitleLines: [],
        ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
        ankiConnectUrl: 'http://localhost:8765',
        selectedDeck: '',
        globalTags: [],
        bulkCreateLimit: 10,
        autoDeleteSynced: false,
        showBulkCreateButton: false,
        audioVolume: 1,
        screenshotTimingPercent: 50,
        setProjectName: vi.fn(),
        setSubtitles: vi.fn(),
        setAnkiConfig: vi.fn(),
        setAnkiConnectUrl: vi.fn(),
        setSelectedDeck,
        setGlobalTags: vi.fn(),
        setBulkCreateLimit: vi.fn(),
        setAutoDeleteSynced: vi.fn(),
        setShowBulkCreateButton: vi.fn(),
        setScreenshotTimingPercent,
        setHasUnsavedChanges: vi.fn(),
        showNotification: vi.fn(),
        t: (k) => k,
        saveProjectRecordFn: vi.fn(async () => {}),
        loadProjectRecordFn,
        createProjectRecordFn: vi.fn(),
        resetStoreState: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleLoadProject({target: {files: [{name: 'x.subs2anki'}]}} as any);
    });

    expect(setSelectedDeck).toHaveBeenCalledWith('DeckX');
    expect(setScreenshotTimingPercent).toHaveBeenCalledWith(75);
  });

  it('defaults screenshot timing percent to 50 when missing in project file', async () => {
    const setScreenshotTimingPercent = vi.fn();
    const loadProjectRecordFn = vi.fn(async () => ({
      projectName: 'Proj',
      subtitleLines: [],
      subtitleFileName: 'a.srt',
      ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
      ankiConnectUrl: 'http://localhost:8765',
      selectedDeck: 'DeckX',
      globalTags: ['tag1'],
    }));

    const {result} = renderHook(() =>
      useProjectActions({
        projectName: 'Proj',
        videoName: 'v.mp4',
        subtitleFileName: 'a.srt',
        subtitleLines: [],
        ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
        ankiConnectUrl: 'http://localhost:8765',
        selectedDeck: '',
        globalTags: [],
        bulkCreateLimit: 10,
        autoDeleteSynced: false,
        showBulkCreateButton: false,
        audioVolume: 1,
        screenshotTimingPercent: 80,
        setProjectName: vi.fn(),
        setSubtitles: vi.fn(),
        setAnkiConfig: vi.fn(),
        setAnkiConnectUrl: vi.fn(),
        setSelectedDeck: vi.fn(),
        setGlobalTags: vi.fn(),
        setBulkCreateLimit: vi.fn(),
        setAutoDeleteSynced: vi.fn(),
        setShowBulkCreateButton: vi.fn(),
        setScreenshotTimingPercent,
        setHasUnsavedChanges: vi.fn(),
        showNotification: vi.fn(),
        t: (k) => k,
        saveProjectRecordFn: vi.fn(async () => {}),
        loadProjectRecordFn,
        createProjectRecordFn: vi.fn(),
        resetStoreState: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleLoadProject({target: {files: [{name: 'x.subs2anki'}]}} as any);
    });

    expect(setScreenshotTimingPercent).toHaveBeenCalledWith(50);
  });

  it('passes screenshot timing percent when saving project', async () => {
    const createProjectRecordFn = vi.fn(() => ({} as any));
    const saveProjectRecordFn = vi.fn(async () => {});

    const {result} = renderHook(() =>
      useProjectActions({
        projectName: 'Proj',
        videoName: 'v.mp4',
        subtitleFileName: 'a.srt',
        subtitleLines: [],
        ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
        ankiConnectUrl: 'http://localhost:8765',
        selectedDeck: 'DeckX',
        globalTags: ['tag1'],
        bulkCreateLimit: 10,
        autoDeleteSynced: false,
        showBulkCreateButton: false,
        audioVolume: 1,
        screenshotTimingPercent: 25,
        setProjectName: vi.fn(),
        setSubtitles: vi.fn(),
        setAnkiConfig: vi.fn(),
        setAnkiConnectUrl: vi.fn(),
        setSelectedDeck: vi.fn(),
        setGlobalTags: vi.fn(),
        setBulkCreateLimit: vi.fn(),
        setAutoDeleteSynced: vi.fn(),
        setShowBulkCreateButton: vi.fn(),
        setScreenshotTimingPercent: vi.fn(),
        setHasUnsavedChanges: vi.fn(),
        showNotification: vi.fn(),
        t: (k) => k,
        saveProjectRecordFn,
        loadProjectRecordFn: vi.fn(),
        createProjectRecordFn,
        resetStoreState: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleSaveProject();
    });

    expect(createProjectRecordFn).toHaveBeenCalledWith(
      expect.any(Object),
      'DeckX',
      ['tag1'],
      10,
      false,
      false,
      1,
      25,
    );
  });
});



