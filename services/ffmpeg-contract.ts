export interface VideoSource {
  file: File | null;
  path: string | null;
}

export interface MediaProcessingService {
  prepareVideoSource(source: VideoSource): Promise<void>;
  extractAudioClip(source: VideoSource, start: number, end: number, volume?: number): Promise<Blob>;
}
