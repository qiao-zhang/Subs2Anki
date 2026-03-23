export interface VideoSource {
  file: File | null;
  path: string | null;
}

export interface FfmpegAvailability {
  available: boolean;
  message: string;
  binaryPath: string | null;
  targetTriple?: string;
}

export interface MediaProcessingService {
  prepareVideoSource(source: VideoSource): Promise<void>;
  getAvailability(forceRefresh?: boolean): Promise<FfmpegAvailability>;
  extractAudioClip(source: VideoSource, start: number, end: number, volume?: number): Promise<Blob>;
}
