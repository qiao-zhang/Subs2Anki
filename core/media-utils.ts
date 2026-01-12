/// <reference lib="dom" />

/**
 * Captures an audio segment directly from the video element using the MediaRecorder API.
 * This approach avoids decoding the entire audio file into memory (preventing OOM)
 * and works with any format the browser can play.
 * 
 * Note: This is a real-time (or playback-speed) process. 
 * A 5-second clip takes 5 seconds to capture.
 * 
 * @param video - The source HTMLVideoElement
 * @param start - Start time in seconds
 * @param end - End time in seconds
 * @returns Promise resolving to the recorded Audio Blob
 */
export const captureAudioFromVideo = (
  video: HTMLVideoElement,
  start: number,
  end: number
): Promise<Blob | null> => {
  return new Promise((resolve, reject) => {
    const duration = end - start;
    if (!video || duration <= 0) {
      resolve(null);
      return;
    }

    // 1. Save original state to restore later
    const originalTime = video.currentTime;
    const originalPaused = video.paused;
    const originalMuted = video.muted;
    const originalVolume = video.volume;

    try {
      // 2. Get the stream
      // Handle cross-browser compatibility for captureStream
      const stream: MediaStream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream();
      
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn("No audio tracks found in video stream.");
        resolve(null);
        return;
      }

      // Create a stream with only audio to save bandwidth/processing
      const audioStream = new MediaStream(audioTracks);

      // 3. Setup Recorder
      // Try to use a widely supported mime type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'; // Safari fallback
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Let browser choose default
        }
      }

      const recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // 4. Handle Stop
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        
        // Restore State
        video.currentTime = originalTime;
        if (originalPaused) video.pause();
        else video.play();
        video.muted = originalMuted;
        video.volume = originalVolume;
        
        // Remove listener
        video.removeEventListener('timeupdate', checkTime);
        
        resolve(blob);
      };

      // 5. Control Playback & Recording
      const checkTime = () => {
        if (video.currentTime >= end) {
          if (recorder.state !== 'inactive') recorder.stop();
          video.pause();
        }
      };

      // Setup Playback for recording
      video.currentTime = start;
      // We must unmute for captureStream to capture audio on some browsers,
      // but we can set volume low if we want (though capturing 'what is heard' usually requires volume > 0)
      video.muted = false; 
      // Optional: Set volume to 1.0 to ensure good capture level, or keep user volume
      
      video.addEventListener('timeupdate', checkTime);
      
      recorder.start();
      video.play().catch(e => {
        console.error("Playback failed during capture", e);
        recorder.stop();
        resolve(null);
      });

    } catch (e) {
      console.error("Audio capture error:", e);
      // Attempt restore
      try {
        video.currentTime = originalTime;
        if (originalPaused) video.pause();
      } catch {}
      resolve(null);
    }
  });
};