import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import type { MediaProcessingService, VideoSource } from './ffmpeg-contract.ts';

class WebFFmpegService implements MediaProcessingService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;
  private loadPromise: Promise<void> | null = null;

  async prepareVideoSource(source: VideoSource) {
    if (!source.file) {
      return;
    }

    await this.load();
  }

  private async load() {
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      const baseURL = '/ffmpeg';

      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        this.ffmpeg = ffmpeg;
        this.loaded = true;
      } catch (e) {
        console.error('Failed to load FFmpeg', e);
        this.loadPromise = null;
        throw e;
      }
    })();

    return this.loadPromise;
  }

  async extractAudioClip(source: VideoSource, start: number, end: number, volume: number = 1.5): Promise<Blob> {
    if (!source.file) {
      throw new Error('A browser File is required for web audio extraction');
    }

    if (!this.loaded) {
      await this.load();
    }

    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }

    const duration = Math.max(0.1, end - start);
    const inputName = 'input_audio.video';
    const outputName = 'output.wav';

    await this.ffmpeg.writeFile(inputName, await fetchFile(source.file));

    await this.ffmpeg.exec([
      '-ss', start.toString(),
      '-t', duration.toString(),
      '-i', inputName,
      '-vn',
      '-af', `volume=${volume}`,
      '-acodec', 'pcm_s16le',
      '-ar', '44100',
      '-y',
      outputName,
    ]);

    const data = await this.ffmpeg.readFile(outputName);

    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([data], { type: 'audio/wav' });
  }
}

const webFFmpegService = new WebFFmpegService();

export default webFFmpegService;
