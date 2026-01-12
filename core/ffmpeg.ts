
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

/**
 * Singleton service for handling FFmpeg operations.
 * Allows fast extraction of audio clips and GIFs without real-time playback.
 */
class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private loaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Initializes the FFmpeg WASM core.
   * Loads from unpkg CDN.
   */
  async load() {
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      // Use version 0.12.x
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
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

  /**
   * Extracts a GIF clip from a video file.
   * Resizes to width 480px, fps 10 for reasonable size/performance.
   */
  async extractGifClip(file: File, start: number, end: number): Promise<string> {
    if (!this.loaded) {
      await this.load();
    }
    
    if (!this.ffmpeg) throw new Error("FFmpeg not loaded");

    const duration = Math.max(0.1, end - start);
    // Limit max duration for GIF to prevent crashes/huge files
    const safeDuration = Math.min(duration, 5.0).toString();

    const inputName = 'input_gif.video';
    const outputName = 'output.gif';
    const paletteName = 'palette.png';

    await this.ffmpeg.writeFile(inputName, await fetchFile(file));

    // 1. Generate Palette for better quality
    // filters: fps=10, scale=480:-1 (maintain aspect ratio)
    await this.ffmpeg.exec([
        '-ss', start.toString(),
        '-t', safeDuration,
        '-i', inputName,
        '-vf', 'fps=10,scale=480:-1:flags=lanczos,palettegen',
        '-y',
        paletteName
    ]);

    // 2. Generate GIF using palette
    await this.ffmpeg.exec([
        '-ss', start.toString(),
        '-t', safeDuration,
        '-i', inputName,
        '-i', paletteName,
        '-nhb',
        '-filter_complex', 'fps=10,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse',
        '-y',
        outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    
    // Cleanup
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(paletteName);
    await this.ffmpeg.deleteFile(outputName);

    // Convert Uint8Array to Base64 String
    const blob = new Blob([data], { type: 'image/gif' });
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
  }
}

export const ffmpegService = new FFmpegService();
