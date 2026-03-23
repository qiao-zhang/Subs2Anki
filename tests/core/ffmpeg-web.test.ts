import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadMock: vi.fn(),
  writeFileMock: vi.fn(),
  execMock: vi.fn(),
  readFileMock: vi.fn(),
  deleteFileMock: vi.fn(),
  toBlobURLMock: vi.fn(),
  fetchFileMock: vi.fn(),
}));

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: class {
    load = mocks.loadMock;
    writeFile = mocks.writeFileMock;
    exec = mocks.execMock;
    readFile = mocks.readFileMock;
    deleteFile = mocks.deleteFileMock;
  },
}));

vi.mock('@ffmpeg/util', () => ({
  toBlobURL: mocks.toBlobURLMock,
  fetchFile: mocks.fetchFileMock,
}));

import webFFmpegService from '@/services/ffmpeg-web.ts';

describe('webFFmpegService', () => {
  beforeEach(() => {
    mocks.loadMock.mockReset();
    mocks.writeFileMock.mockReset();
    mocks.execMock.mockReset();
    mocks.readFileMock.mockReset();
    mocks.deleteFileMock.mockReset();
    mocks.toBlobURLMock.mockReset();
    mocks.fetchFileMock.mockReset();

    mocks.toBlobURLMock.mockImplementation(async (url: string) => url);
    mocks.fetchFileMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mocks.readFileMock.mockResolvedValue(new Uint8Array([4, 5, 6]));

    const service = webFFmpegService as any;
    service.ffmpeg = null;
    service.loaded = false;
    service.loadPromise = null;
  });

  it('reports web FFmpeg availability', async () => {
    await expect(webFFmpegService.getAvailability()).resolves.toEqual({
      available: true,
      message: 'Web mode uses FFmpeg.wasm.',
      binaryPath: null,
      targetTriple: undefined,
    });
  });

  it('does not load FFmpeg when no browser File is provided', async () => {
    await webFFmpegService.prepareVideoSource({ file: null, path: null });
    expect(mocks.loadMock).not.toHaveBeenCalled();
  });

  it('retries loading after a previous load failure', async () => {
    mocks.loadMock.mockRejectedValueOnce(new Error('broken wasm')).mockResolvedValueOnce(undefined);
    const file = new File(['video'], 'lesson.mp4', { type: 'video/mp4' });

    await expect(webFFmpegService.prepareVideoSource({ file, path: null })).rejects.toThrow('broken wasm');
    await expect(webFFmpegService.prepareVideoSource({ file, path: null })).resolves.toBeUndefined();
    expect(mocks.loadMock).toHaveBeenCalledTimes(2);
  });

  it('extracts an audio clip once FFmpeg is loaded', async () => {
    mocks.loadMock.mockResolvedValue(undefined);
    mocks.execMock.mockResolvedValue(undefined);
    const file = new File(['video'], 'lesson.mp4', { type: 'video/mp4' });

    const blob = await webFFmpegService.extractAudioClip({ file, path: null }, 1, 3, 1.2);

    expect(blob).toBeInstanceOf(Blob);
    expect(mocks.writeFileMock).toHaveBeenCalledOnce();
    expect(mocks.execMock).toHaveBeenCalledOnce();
    expect(mocks.readFileMock).toHaveBeenCalledWith('output.wav');
    expect(mocks.deleteFileMock).toHaveBeenCalledTimes(2);
  });
});
