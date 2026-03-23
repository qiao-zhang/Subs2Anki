import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import SettingsModal from '../../components/modals/SettingsModal.tsx';

beforeAll(() => {
  vi.stubGlobal('__TAURI_BUILD__', true);
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('../../services/anki-connect.ts', () => ({
  checkConnection: vi.fn(),
}));

describe('SettingsModal desktop FFmpeg status', () => {
  it('renders the desktop FFmpeg status and resolved path in Tauri mode', () => {
    const html = renderToStaticMarkup(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        ankiConnectUrl="http://127.0.0.1:8765"
        onSaveAnkiConnectUrl={vi.fn()}
        autoDeleteSynced={false}
        onAutoDeleteSyncedChange={vi.fn()}
        bulkCreateLimit={10}
        onBulkCreateLimitChange={vi.fn()}
        showBulkCreateButton={true}
        onShowBulkCreateButtonChange={vi.fn()}
        audioVolume={1.5}
        onAudioVolumeChange={vi.fn()}
        ffmpegStatus={{
          available: true,
          message: 'ffmpeg version 7.0',
          binaryPath: 'C:/ffmpeg/ffmpeg.exe',
        }}
        isFfmpegCheckPending={false}
      />
    );

    expect(html).toContain('Desktop FFmpeg');
    expect(html).toContain('Desktop FFmpeg is ready');
    expect(html).toContain('ffmpeg version 7.0');
    expect(html).toContain('C:/ffmpeg/ffmpeg.exe');
  });

  it('renders troubleshooting steps and a re-check button when FFmpeg is unavailable', () => {
    const html = renderToStaticMarkup(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        ankiConnectUrl="http://127.0.0.1:8765"
        onSaveAnkiConnectUrl={vi.fn()}
        autoDeleteSynced={false}
        onAutoDeleteSyncedChange={vi.fn()}
        bulkCreateLimit={10}
        onBulkCreateLimitChange={vi.fn()}
        showBulkCreateButton={true}
        onShowBulkCreateButtonChange={vi.fn()}
        audioVolume={1.5}
        onAudioVolumeChange={vi.fn()}
        ffmpegStatus={{
          available: false,
          message: 'FFmpeg is not available.',
          binaryPath: null,
          targetTriple: 'x86_64-pc-windows-msvc',
        }}
        isFfmpegCheckPending={false}
        onRecheckFfmpeg={vi.fn()}
      />
    );

    expect(html).toContain('How to fix it');
    expect(html).toContain('Re-check FFmpeg');
    expect(html).toContain('ffmpeg-x86_64-pc-windows-msvc.exe');
    expect(html).toContain('npm run prepare:ffmpeg-sidecar -- &lt;path-to-ffmpeg-binary&gt; x86_64-pc-windows-msvc');
    expect(html).toContain('SUBS2ANKI_FFMPEG_PATH');
  });
});
