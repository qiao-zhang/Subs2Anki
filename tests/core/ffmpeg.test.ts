import {beforeEach, describe, expect, it, vi} from 'vitest';

const ffmpegMockState = vi.hoisted(() => ({
  instances: [] as Array<{
    load: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    deleteFile: ReturnType<typeof vi.fn>;
    exec: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
  }>,
  implQueue: [] as Array<{
    load: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    deleteFile: ReturnType<typeof vi.fn>;
    exec: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
  }>,
  ctorCallCount: 0,
}));

const createMockFFmpegInstance = () => {
  return {
    load: vi.fn(async () => undefined),
    writeFile: vi.fn(async () => undefined),
    deleteFile: vi.fn(async () => undefined),
    exec: vi.fn(async () => undefined),
    readFile: vi.fn(async () => new Uint8Array([1, 2, 3])),
    terminate: vi.fn(),
  };
};

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: class {
    load = vi.fn(async () => undefined);
    writeFile = vi.fn(async () => undefined);
    deleteFile = vi.fn(async () => undefined);
    exec = vi.fn(async () => undefined);
    readFile = vi.fn(async () => new Uint8Array([1, 2, 3]));
    terminate = vi.fn();

    constructor() {
      ffmpegMockState.ctorCallCount += 1;
      const queued = ffmpegMockState.implQueue.shift();
      if (queued) {
        this.load = queued.load as typeof this.load;
        this.writeFile = queued.writeFile as typeof this.writeFile;
        this.deleteFile = queued.deleteFile as typeof this.deleteFile;
        this.exec = queued.exec as typeof this.exec;
        this.readFile = queued.readFile as typeof this.readFile;
        this.terminate = queued.terminate as typeof this.terminate;
      }

      ffmpegMockState.instances.push(this);
    }
  },
}));

vi.mock('@ffmpeg/util', () => ({
  toBlobURL: vi.fn(async (url: string) => `blob:${url}`),
  fetchFile: vi.fn(async () => new Uint8Array([9, 9, 9])),
}));

import {ffmpegService} from '../../services/ffmpeg.ts';

const resetService = () => {
  const service = ffmpegService as unknown as {
    ffmpeg: unknown;
    loaded: boolean;
    loadPromise: Promise<void> | null;
    cachedInputFileKey: string | null;
    processedClipCount: number;
  };

  service.ffmpeg = null;
  service.loaded = false;
  service.loadPromise = null;
  service.cachedInputFileKey = null;
  service.processedClipCount = 0;
  ffmpegMockState.instances.length = 0;
  ffmpegMockState.implQueue.length = 0;
  ffmpegMockState.ctorCallCount = 0;
};

describe('ffmpegService', () => {
  beforeEach(() => {
    resetService();
  });

  it('loads FFmpeg only once when called concurrently', async () => {
    await Promise.all([ffmpegService.load(), ffmpegService.load()]);

    expect(ffmpegMockState.ctorCallCount).toBe(1);
    expect(ffmpegMockState.instances[0]?.load).toHaveBeenCalledTimes(1);
  });

  it('extracts clip with minimum duration and cleans output file', async () => {
    const file = new File(['video'], 'demo.mp4', {type: 'video/mp4'});
    const blob = await ffmpegService.extractAudioClip(file, 3, 2, 2);

    expect(blob.type).toBe('audio/wav');
    expect(ffmpegMockState.instances[0]?.exec).toHaveBeenCalledWith([
      '-ss',
      '3',
      '-t',
      '0.1',
      '-i',
      'input_audio.video',
      '-vn',
      '-af',
      'volume=2',
      '-acodec',
      'pcm_s16le',
      '-ar',
      '44100',
      '-y',
      'output.wav',
    ]);
    expect(ffmpegMockState.instances[0]?.deleteFile).toHaveBeenCalledWith('output.wav');
  });

  it('reuses cached input file for the same source file', async () => {
    const file = new File(['video'], 'same.mp4', {type: 'video/mp4'});

    await ffmpegService.extractAudioClip(file, 0, 1);
    await ffmpegService.extractAudioClip(file, 1, 2);

    expect(ffmpegMockState.instances[0]?.writeFile).toHaveBeenCalledTimes(1);
  });

  it('recreates instance and retries once on memory-like errors', async () => {
    const file = new File(['video'], 'retry.mp4', {type: 'video/mp4'});

    const first = createMockFFmpegInstance();
    first.exec.mockRejectedValueOnce(new Error('wasm memory out of bounds'));
    const second = createMockFFmpegInstance();

    resetService();
    ffmpegMockState.implQueue.push(first, second);

    await ffmpegService.extractAudioClip(file, 0, 1);

    expect(first.exec).toHaveBeenCalledTimes(1);
    expect(first.terminate).toHaveBeenCalledTimes(1);
    expect(second.exec).toHaveBeenCalledTimes(1);
  });
});




