/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useProjectPersistence } from '@/hooks/useProjectPersistence.ts';
import type { AnkiNoteType, SubtitleLine } from '@/services/types.ts';

const mocks = vi.hoisted(() => ({
  createProjectRecord: vi.fn(),
  saveProjectRecord: vi.fn(),
  loadProjectRecord: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; error?: string }) => {
      if (_key === 'notifications.projectSaveFailed') {
        return `Failed to save project: ${options?.error}`;
      }
      if (_key === 'notifications.projectLoadFailed') {
        return `Failed to load project: ${options?.error}`;
      }
      return options?.defaultValue ?? _key;
    },
  }),
}));

vi.mock('@/services/project-record.ts', () => ({
  createProjectRecord: mocks.createProjectRecord,
  saveProjectRecord: mocks.saveProjectRecord,
  loadProjectRecord: mocks.loadProjectRecord,
}));

const noteType: AnkiNoteType = {
  id: 1,
  name: 'Subs2Anki',
  css: '',
  fields: [{ name: 'Front', source: 'Text' }],
  templates: [{ Name: 'Card 1', Front: '{{Front}}', Back: '{{Front}}' }],
};

const subtitleLines: SubtitleLine[] = [
  { id: 1, startTime: 0, endTime: 1, text: 'Line', status: 'normal' },
];

function Probe(props: {
  showNotification?: (text: string) => void;
  setProjectName?: (name: string) => void;
  setSubtitles?: (lines: SubtitleLine[], fileName: string, fileHandle?: BrowserFileHandle | null, subtitlePath?: string | null) => void;
  setAnkiConfig?: (config: AnkiNoteType) => void;
  setAnkiConnectUrl?: (url: string) => void;
  setSelectedDeck?: (deck: string) => void;
  setGlobalTags?: (tags: string[]) => void;
  setBulkCreateLimit?: (limit: number) => void;
  setAutoDeleteSynced?: (enabled: boolean) => void;
  setShowBulkCreateButton?: (show: boolean) => void;
  setAudioVolume?: (volume: number) => void;
}) {
  const hook = useProjectPersistence({
    projectName: 'Lesson 1',
    videoName: 'lesson.mp4',
    subtitleFileName: 'lesson.srt',
    subtitleLines,
    ankiConfig: noteType,
    ankiConnectUrl: 'http://127.0.0.1:8765',
    selectedDeck: 'Deck',
    globalTags: ['tag-a'],
    bulkCreateLimit: 12,
    autoDeleteSynced: true,
    showBulkCreateButton: false,
    audioVolume: 1.8,
    setProjectName: props.setProjectName ?? vi.fn(),
    setSubtitles: props.setSubtitles ?? vi.fn(),
    setAnkiConfig: props.setAnkiConfig ?? vi.fn(),
    setAnkiConnectUrl: props.setAnkiConnectUrl ?? vi.fn(),
    setSelectedDeck: props.setSelectedDeck ?? vi.fn(),
    setGlobalTags: props.setGlobalTags ?? vi.fn(),
    setBulkCreateLimit: props.setBulkCreateLimit ?? vi.fn(),
    setAutoDeleteSynced: props.setAutoDeleteSynced ?? vi.fn(),
    setShowBulkCreateButton: props.setShowBulkCreateButton ?? vi.fn(),
    setAudioVolume: props.setAudioVolume ?? vi.fn(),
    showNotification: props.showNotification ?? vi.fn(),
  });

  return (
    <div>
      <button type="button" onClick={() => void hook.handleSaveProject()}>save</button>
      <input
        data-testid="load-input"
        type="file"
        onChange={(event) => void hook.handleLoadProject(event)}
      />
    </div>
  );
}

describe('useProjectPersistence', () => {
  beforeEach(() => {
    mocks.createProjectRecord.mockReset();
    mocks.saveProjectRecord.mockReset();
    mocks.loadProjectRecord.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('creates and saves a project record, then shows a success notification', async () => {
    const showNotification = vi.fn();
    mocks.createProjectRecord.mockReturnValue({ version: '1.2.0' });
    mocks.saveProjectRecord.mockResolvedValue(undefined);

    render(<Probe showNotification={showNotification} />);
    fireEvent.click(screen.getByText('save'));

    await waitFor(() => {
      expect(mocks.createProjectRecord).toHaveBeenCalledOnce();
      expect(mocks.saveProjectRecord).toHaveBeenCalledWith({ version: '1.2.0' });
    });

    expect(showNotification).toHaveBeenCalledWith('Project saved successfully!');
  });

  it('loads a project record, restores persisted settings, and falls back deck name when needed', async () => {
    const setProjectName = vi.fn();
    const setSubtitles = vi.fn();
    const setAnkiConfig = vi.fn();
    const setAnkiConnectUrl = vi.fn();
    const setSelectedDeck = vi.fn();
    const setGlobalTags = vi.fn();
    const setBulkCreateLimit = vi.fn();
    const setAutoDeleteSynced = vi.fn();
    const setShowBulkCreateButton = vi.fn();
    const setAudioVolume = vi.fn();
    const showNotification = vi.fn();

    mocks.loadProjectRecord.mockResolvedValue({
      projectName: 'Loaded Project',
      subtitleFileName: 'loaded.srt',
      subtitleLines,
      ankiConfig: noteType,
      ankiConnectUrl: 'http://localhost:8765',
      globalTags: ['tag-b'],
      bulkCreateLimit: 7,
      autoDeleteSynced: false,
      showBulkCreateButton: true,
      audioVolume: 2.2,
    });

    render(
      <Probe
        setProjectName={setProjectName}
        setSubtitles={setSubtitles}
        setAnkiConfig={setAnkiConfig}
        setAnkiConnectUrl={setAnkiConnectUrl}
        setSelectedDeck={setSelectedDeck}
        setGlobalTags={setGlobalTags}
        setBulkCreateLimit={setBulkCreateLimit}
        setAutoDeleteSynced={setAutoDeleteSynced}
        setShowBulkCreateButton={setShowBulkCreateButton}
        setAudioVolume={setAudioVolume}
        showNotification={showNotification}
      />,
    );

    const input = screen.getByTestId('load-input') as HTMLInputElement;
    const file = new File(['{}'], 'project.subs2anki', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(setProjectName).toHaveBeenCalledWith('Loaded Project');
    });

    expect(setSubtitles).toHaveBeenCalledWith(subtitleLines, 'loaded.srt');
    expect(setAnkiConfig).toHaveBeenCalledWith(noteType);
    expect(setAnkiConnectUrl).toHaveBeenCalledWith('http://localhost:8765');
    expect(setSelectedDeck).toHaveBeenCalledWith('Subs2Anki::Loaded Project');
    expect(setGlobalTags).toHaveBeenCalledWith(['tag-b']);
    expect(setBulkCreateLimit).toHaveBeenCalledWith(7);
    expect(setAutoDeleteSynced).toHaveBeenCalledWith(false);
    expect(setShowBulkCreateButton).toHaveBeenCalledWith(true);
    expect(setAudioVolume).toHaveBeenCalledWith(2.2);
    expect(showNotification).toHaveBeenCalledWith('Project loaded successfully!');
  });

  it('notifies when project loading fails', async () => {
    mocks.loadProjectRecord.mockRejectedValue(new Error('broken file'));
    const showNotification = vi.fn();

    render(<Probe showNotification={showNotification} />);

    const input = screen.getByTestId('load-input') as HTMLInputElement;
    const file = new File(['{}'], 'broken.subs2anki', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith('Failed to load project: broken file');
    });
  });
});

