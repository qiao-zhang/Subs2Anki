import {act, renderHook} from '@testing-library/react';
import type {ChangeEvent} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {useProjectActions} from '../../../hooks/app/useProjectActions.ts';

const createMockLoadEvent = (fileName: string): ChangeEvent<HTMLInputElement> => {
  const input = document.createElement('input');
  const file = new File(['{}'], fileName, {type: 'application/json'});
  Object.defineProperty(input, 'files', {
    value: [file],
    configurable: true,
  });
  return {target: input} as ChangeEvent<HTMLInputElement>;
};

describe('useProjectActions', () => {
  it('loads project and restores selected deck', async () => {
    const setSelectedDeck = vi.fn();
    const setScreenshotTimingPercent = vi.fn();
    const loadProjectRecordFn = vi.fn(async () => ({
      version: '1.2.0',
      projectName: 'Proj',
      videoName: 'v.mp4',
      subtitleLines: [],
      subtitleFileName: 'a.srt',
      ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
      ankiConnectUrl: 'http://localhost:8765',
      selectedDeck: 'DeckX',
      globalTags: ['tag1'],
      screenshotTimingPercent: 75,
      timestamp: new Date().toISOString(),
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
      await result.current.handleLoadProject(createMockLoadEvent('x.subs2anki'));
    });

    expect(setSelectedDeck).toHaveBeenCalledWith('DeckX');
    expect(setScreenshotTimingPercent).toHaveBeenCalledWith(75);
  });

  it('defaults screenshot timing percent to 50 when missing in project file', async () => {
    const setScreenshotTimingPercent = vi.fn();
    const loadProjectRecordFn = vi.fn(async () => ({
      version: '1.2.0',
      projectName: 'Proj',
      videoName: 'v.mp4',
      subtitleLines: [],
      subtitleFileName: 'a.srt',
      ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
      ankiConnectUrl: 'http://localhost:8765',
      selectedDeck: 'DeckX',
      globalTags: ['tag1'],
      timestamp: new Date().toISOString(),
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
      await result.current.handleLoadProject(createMockLoadEvent('x.subs2anki'));
    });

    expect(setScreenshotTimingPercent).toHaveBeenCalledWith(50);
  });

  it('passes screenshot timing percent when saving project', async () => {
    const createProjectRecordFn = vi.fn(() => ({
      version: '1.2.0',
      projectName: 'Proj',
      videoName: 'v.mp4',
      subtitleLines: [],
      subtitleFileName: 'a.srt',
      ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
      ankiConnectUrl: 'http://localhost:8765',
      timestamp: new Date().toISOString(),
    }));
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

  it('uses tauri save path when running in tauri runtime', async () => {
    window.__TAURI_INTERNALS__ = {};

    const saveProjectRecordViaTauriFn = vi.fn(async () => true);
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
        screenshotTimingPercent: 50,
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
        saveProjectRecordViaTauriFn,
        loadProjectRecordFn: vi.fn(),
        createProjectRecordFn: vi.fn(() => ({
          version: '1.2.0',
          projectName: 'Proj',
          videoName: 'v.mp4',
          subtitleLines: [],
          subtitleFileName: 'a.srt',
          ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
          ankiConnectUrl: 'http://localhost:8765',
          timestamp: new Date().toISOString(),
        })),
        resetStoreState: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleSaveProject();
    });

    expect(saveProjectRecordViaTauriFn).toHaveBeenCalled();
    expect(saveProjectRecordFn).not.toHaveBeenCalled();
    delete window.__TAURI_INTERNALS__;
  });

  it('uses tauri load path when running in tauri runtime', async () => {
    window.__TAURI_INTERNALS__ = {};

    const loadProjectRecordViaTauriFn = vi.fn(async () => ({
      version: '1.2.0',
      projectName: 'Proj',
      videoName: 'v.mp4',
      subtitleLines: [],
      subtitleFileName: 'a.srt',
      ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
      ankiConnectUrl: 'http://localhost:8765',
      selectedDeck: 'DeckX',
      globalTags: ['tag1'],
      timestamp: new Date().toISOString(),
    }));
    const loadProjectRecordFn = vi.fn();
    const setProjectName = vi.fn();

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
        setProjectName,
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
        saveProjectRecordFn: vi.fn(async () => {}),
        loadProjectRecordFn,
        loadProjectRecordViaTauriFn,
        createProjectRecordFn: vi.fn(),
        resetStoreState: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleLoadProject();
    });

    expect(loadProjectRecordViaTauriFn).toHaveBeenCalled();
    expect(loadProjectRecordFn).not.toHaveBeenCalled();
    expect(setProjectName).toHaveBeenCalledWith('Proj');
    delete window.__TAURI_INTERNALS__;
  });
});







