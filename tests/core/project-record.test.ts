import {describe, expect, it, vi} from 'vitest';
import {
  createProjectRecord,
  loadProjectRecord,
  loadProjectRecordViaTauri,
  saveProjectRecordViaTauri,
} from '../../services/project-record.ts';

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(async () => 'E:/tmp/demo.subs2anki'),
  save: vi.fn(async () => 'E:/tmp/demo.subs2anki'),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(async () => JSON.stringify({
    version: '1.2.0',
    projectName: 'Demo',
    videoName: 'video.mp4',
    subtitleLines: [{id: 1, startTime: 1, endTime: 2, text: 'a', locked: true}],
    subtitleFileName: 'demo.srt',
    ankiConfig: {id: 1, name: 'Demo', css: '', fields: [], templates: []},
    ankiConnectUrl: 'http://127.0.0.1:8765',
    timestamp: new Date().toISOString(),
  })),
  writeTextFile: vi.fn(async () => undefined),
}));

const createBaseRecord = () => ({
  version: '1.2.0',
  projectName: 'Demo',
  videoName: 'video.mp4',
  subtitleLines: [{id: 1, startTime: 1, endTime: 2, text: 'line', status: 'normal' as const}],
  subtitleFileName: 'demo.srt',
  ankiConfig: {id: 1, name: 'Demo', css: '', fields: [], templates: []},
  ankiConnectUrl: 'http://127.0.0.1:8765',
  timestamp: new Date().toISOString(),
});

describe('project-record service', () => {
  it('creates a project record with persisted settings', () => {
    const record = createProjectRecord(
      {
        projectName: 'Demo',
        videoName: 'video.mp4',
        subtitleFileName: 'demo.srt',
        subtitleLines: [{id: 1, startTime: 1, endTime: 2, text: 'line', status: 'normal'}],
        ankiConfig: {id: 1, name: 'Demo', css: '', fields: [], templates: []},
        ankiConnectUrl: 'http://127.0.0.1:8765',
      },
      'Deck1',
      ['tag1'],
      10,
      true,
      true,
      2,
      75,
    );

    expect(record.selectedDeck).toBe('Deck1');
    expect(record.globalTags).toEqual(['tag1']);
    expect(record.bulkCreateLimit).toBe(10);
    expect(record.autoDeleteSynced).toBe(true);
    expect(record.showBulkCreateButton).toBe(true);
    expect(record.audioVolume).toBe(2);
    expect(record.screenshotTimingPercent).toBe(75);
  });

  it('loads and converts legacy subtitle locked field to status', async () => {
    const legacy = {
      ...createBaseRecord(),
      subtitleLines: [
        {id: 1, startTime: 1, endTime: 2, text: 'legacy line', locked: true},
      ],
    };

    const file = new File([JSON.stringify(legacy)], 'legacy.subs2anki', {type: 'application/json'});
    const loaded = await loadProjectRecord(file);

    expect(loaded.subtitleLines[0]?.status).toBe('locked');
  });

  it('rejects invalid project records', async () => {
    const invalid = {
      ...createBaseRecord(),
      subtitleLines: [{id: 1, startTime: 1, endTime: 2, text: 'bad', status: 'broken'}],
    };

    const file = new File([JSON.stringify(invalid)], 'invalid.subs2anki', {type: 'application/json'});

    await expect(loadProjectRecord(file)).rejects.toThrow('无效的项目记录文件格式');
  });

  it('uses tauri save and load paths when tauri runtime exists', async () => {
    window.__TAURI_INTERNALS__ = {};

    const saveResult = await saveProjectRecordViaTauri(createBaseRecord());
    const loadResult = await loadProjectRecordViaTauri();

    expect(saveResult).toBe(true);
    expect(loadResult?.projectName).toBe('Demo');
    expect(loadResult?.subtitleLines[0]?.status).toBe('locked');

    delete window.__TAURI_INTERNALS__;
  });
});

