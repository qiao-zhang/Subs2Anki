import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

/**
 * Singleton service for handling FFmpeg operations.
 * Allows fast extraction of audio clips without real-time playback.
 */
class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private loaded: boolean = false;
  private loadPromise: Promise<void> | null = null;
  private cachedInputFileKey: string | null = null;
  private processedClipCount: number = 0;

  // Recreate FFmpeg periodically to keep wasm heap growth bounded.
  private readonly maxClipsBeforeReload = 50;
  private readonly inputName = 'input_audio.video';
  private readonly outputName = 'output.wav';

  /**
   * Initializes the FFmpeg WASM core.
   */
  async load() {
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
        console.error("Failed to load FFmpeg", e);
        this.loadPromise = null;
        throw e;
      }
    })();

    return this.loadPromise;
  }

  private fileKey(file: File): string {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }

  private hasTerminate(value: unknown): value is { terminate: () => void } {
    return typeof value === 'object' && value !== null && 'terminate' in value && typeof (value as { terminate?: unknown }).terminate === 'function';
  }

  private isMemoryLikeError(error: unknown): boolean {
    const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
    return msg.includes('memory') || msg.includes('out of bounds') || msg.includes('abort') || msg.includes('wasm');
  }

  private async recreateInstance() {
    try {
      if (this.hasTerminate(this.ffmpeg)) {
        this.ffmpeg.terminate();
      }
    } catch (e) {
      console.warn('Failed to terminate ffmpeg instance cleanly', e);
    }
    this.ffmpeg = null;
    this.loaded = false;
    this.loadPromise = null;
    this.cachedInputFileKey = null;
    this.processedClipCount = 0;
    await this.load();
  }

  private async ensureInputFile(file: File) {
    if (!this.ffmpeg) throw new Error('FFmpeg not loaded');
    const key = this.fileKey(file);
    if (this.cachedInputFileKey === key) return;

    if (this.cachedInputFileKey !== null) {
      try {
        await this.ffmpeg.deleteFile(this.inputName);
      } catch (e) {
        // ignore if input does not exist in MEMFS
      }
    }

    await this.ffmpeg.writeFile(this.inputName, await fetchFile(file));
    this.cachedInputFileKey = key;
  }

  /**
   * Extracts an audio clip from a video file.
   */
  async extractAudioClip(file: File, start: number, end: number, volume: number = 1.5): Promise<Blob> {
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (!this.loaded) {
          await this.load();
        }
        if (!this.ffmpeg) throw new Error('FFmpeg not loaded');

        if (this.processedClipCount >= this.maxClipsBeforeReload) {
          await this.recreateInstance();
        }

        await this.ensureInputFile(file);

        const duration = Math.max(0.1, end - start);
        await this.ffmpeg.exec([
          '-ss', start.toString(),
          '-t', duration.toString(),
          '-i', this.inputName,
          '-vn',
          '-af', `volume=${volume}`,
          '-acodec', 'pcm_s16le',
          '-ar', '44100',
          '-y',
          this.outputName,
        ]);

        const data = await this.ffmpeg.readFile(this.outputName);
        this.processedClipCount += 1;
        return new Blob([data], { type: 'audio/wav' });
      } catch (e) {
        lastError = e;
        if (attempt === 0 && this.isMemoryLikeError(e)) {
          await this.recreateInstance();
          continue;
        }
        throw e;
      } finally {
        if (this.ffmpeg) {
          try {
            await this.ffmpeg.deleteFile(this.outputName);
          } catch (e) {
            // ignore if output was not generated
          }
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Audio extraction failed');
  }
}

export const ffmpegService = new FFmpegService();
