import { invoke } from '@tauri-apps/api/core';
import type { FfmpegAvailability, MediaProcessingService, VideoSource } from './ffmpeg-contract.ts';

interface ExtractAudioClipRequest {
  start: number;
  end: number;
  volume: number;
}

class TauriFFmpegService implements MediaProcessingService {
  private cachedPath: string | null = null;
  private preparePromise: Promise<void> | null = null;
  private availabilityPromise: Promise<FfmpegAvailability> | null = null;

  async prepareVideoSource(source: VideoSource) {
    if (!source.path) {
      this.cachedPath = null;
      this.preparePromise = null;
      await invoke('clear_video_source_path');
      return;
    }

    if (source.path === this.cachedPath) {
      return;
    }

    if (this.preparePromise) {
      await this.preparePromise;
      if (source.path === this.cachedPath) {
        return;
      }
    }

    this.preparePromise = this.setVideoSourcePath(source.path);
    try {
      await this.preparePromise;
    } finally {
      this.preparePromise = null;
    }
  }

  async getAvailability(forceRefresh: boolean = false): Promise<FfmpegAvailability> {
    if (forceRefresh) {
      this.availabilityPromise = null;
    }

    if (!this.availabilityPromise) {
      this.availabilityPromise = invoke<FfmpegAvailability>('get_ffmpeg_status').catch((error) => {
        this.availabilityPromise = null;
        throw error;
      });
    }

    return this.availabilityPromise;
  }

  async extractAudioClip(source: VideoSource, start: number, end: number, volume: number = 1.5): Promise<Blob> {
    if (!source.path) {
      throw new Error('A local video path is required for Tauri audio extraction');
    }

    await this.prepareVideoSource(source);

    const data = await invoke<number[]>('extract_audio_clip', {
      request: {
        start,
        end,
        volume,
      } satisfies ExtractAudioClipRequest,
    });

    return new Blob([new Uint8Array(data)], { type: 'audio/wav' });
  }

  private async setVideoSourcePath(path: string) {
    await invoke('set_video_source_path', { path });
    this.cachedPath = path;
  }
}

const tauriFFmpegService = new TauriFFmpegService();

export default tauriFFmpegService;
