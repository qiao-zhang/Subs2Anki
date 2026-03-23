/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectRecord, loadProjectRecord, saveProjectRecord } from '@/services/project-record.ts';
import type { AnkiNoteType, SubtitleLine } from '@/services/types.ts';

const noteType: AnkiNoteType = {
  id: 1,
  name: 'Subs2Anki',
  css: '.card {}',
  fields: [{ name: 'Front', source: 'Text' }],
  templates: [{ Name: 'Card 1', Front: '{{Front}}', Back: '{{Front}}' }],
};

const subtitleLines: SubtitleLine[] = [
  { id: 1, startTime: 0, endTime: 2, text: 'hello', status: 'normal' },
];

describe('project-record', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates project records with the current settings payload', () => {
    const record = createProjectRecord({
      projectName: 'Lesson 1',
      videoName: 'lesson.mp4',
      subtitleFileName: 'lesson.srt',
      subtitleLines,
      ankiConfig: noteType,
      ankiConnectUrl: 'http://127.0.0.1:8765',
    }, 'Deck', ['tag-a'], 12, true, false, 1.8);

    expect(record.projectName).toBe('Lesson 1');
    expect(record.selectedDeck).toBe('Deck');
    expect(record.globalTags).toEqual(['tag-a']);
    expect(record.bulkCreateLimit).toBe(12);
    expect(record.autoDeleteSynced).toBe(true);
    expect(record.showBulkCreateButton).toBe(false);
    expect(record.audioVolume).toBe(1.8);
    expect(record.timestamp).toMatch(/T/);
  });

  it('saves project records with the File System Access API when available', async () => {
    const write = vi.fn();
    const close = vi.fn();
    const createWritable = vi.fn(async () => ({ write, close }));
    const showSaveFilePicker = vi.fn(async () => ({ createWritable }));

    vi.stubGlobal('window', { showSaveFilePicker });

    await saveProjectRecord(createProjectRecord({
      projectName: 'Lesson 1',
      videoName: 'lesson.mp4',
      subtitleFileName: 'lesson.srt',
      subtitleLines,
      ankiConfig: noteType,
      ankiConnectUrl: 'http://127.0.0.1:8765',
    }));

    expect(showSaveFilePicker).toHaveBeenCalledOnce();
    expect(createWritable).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it('loads legacy locked subtitle records and converts them to status fields', async () => {
    const legacyRecord = new File([JSON.stringify({
      version: '1.0.0',
      projectName: 'Legacy',
      videoName: 'legacy.mp4',
      subtitleFileName: 'legacy.srt',
      subtitleLines: [{ id: 1, startTime: 0, endTime: 1, text: 'old', locked: true }],
      ankiConfig: noteType,
      ankiConnectUrl: 'http://127.0.0.1:8765',
      timestamp: new Date().toISOString(),
    })], 'legacy.subs2anki', { type: 'application/json' });

    const loaded = await loadProjectRecord(legacyRecord);
    expect(loaded.subtitleLines[0].status).toBe('locked');
  });

  it('rejects invalid project files', async () => {
    const invalidRecord = new File([JSON.stringify({ projectName: 'broken' })], 'broken.subs2anki', { type: 'application/json' });

    await expect(loadProjectRecord(invalidRecord)).rejects.toThrow('无效的项目记录文件格式');
  });
});
