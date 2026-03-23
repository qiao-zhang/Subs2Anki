import type { MediaProcessingService, VideoSource } from './ffmpeg-contract.ts';

let servicePromise: Promise<MediaProcessingService> | null = null;

const loadService = async (): Promise<MediaProcessingService> => {
  if (__TAURI_BUILD__) {
    return (await import('./ffmpeg-tauri.ts')).default;
  }

  return (await import('./ffmpeg-web.ts')).default;
};

const getService = async () => {
  if (!servicePromise) {
    servicePromise = loadService();
  }

  return servicePromise;
};

class FFmpegServiceFacade implements MediaProcessingService {
  async prepareVideoSource(source: VideoSource) {
    const service = await getService();
    await service.prepareVideoSource(source);
  }

  async extractAudioClip(source: VideoSource, start: number, end: number, volume: number = 1.5): Promise<Blob> {
    const service = await getService();
    return service.extractAudioClip(source, start, end, volume);
  }
}

export const ffmpegService = new FFmpegServiceFacade();
