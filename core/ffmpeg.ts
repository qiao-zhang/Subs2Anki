
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

  /**
   * Initializes the FFmpeg WASM core.
   */
  async load() {
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      const baseURL = './ffmpeg';
      
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

  /**
   * Extracts an audio clip from a video file.
   */
  async extractAudioClip(file: File, start: number, end: number): Promise<Blob> {
    if (!this.loaded) {
      await this.load();
    }
    
    if (!this.ffmpeg) throw new Error("FFmpeg not loaded");

    const duration = Math.max(0.1, end - start);
    const inputName = 'input_audio.video'; 
    const outputName = 'output.wav';

    await this.ffmpeg.writeFile(inputName, await fetchFile(file));

    await this.ffmpeg.exec([
      '-ss', start.toString(),
      '-t', duration.toString(),
      '-i', inputName,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '44100',
      '-y',
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([data], { type: 'audio/wav' });
  }
}

export const ffmpegService = new FFmpegService();
