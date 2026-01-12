
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
   * 
   * @param file - The source video File object
   * @param start - Start time in seconds
   * @param end - End time in seconds
   * @returns Blob containing the WAV audio
   */
  async extractAudioClip(file: File, start: number, end: number): Promise<Blob> {
    if (!this.loaded) {
      await this.load();
    }
    
    if (!this.ffmpeg) throw new Error("FFmpeg not loaded");

    const duration = Math.max(0.1, end - start);
    const inputName = 'input.video'; // Use generic extension or derive from file
    const outputName = 'output.wav';

    // 1. Write file to MEMFS
    // Note: Writing large files to MEMFS consumes memory. 
    // For very large files (>2GB), this might still OOM on some systems,
    // but it's generally safer than decoding the whole audio stream to PCM.
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));

    // 2. Run FFmpeg command
    // -ss: Start time
    // -t: Duration
    // -i: Input
    // -vn: No video
    // -acodec pcm_s16le: Uncompressed WAV (safe/compatible)
    // -ar 44100: Standard sample rate
    // -y: Overwrite output
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

    // 3. Read output
    const data = await this.ffmpeg.readFile(outputName);
    
    // 4. Cleanup to free memory
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([data], { type: 'audio/wav' });
  }
}

export const ffmpegService = new FFmpegService();
