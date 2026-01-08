/**
 * Decodes the audio track of a video/audio file into an AudioBuffer.
 * This buffer can be reused to slice segments efficiently.
 */
export const loadAudioBuffer = async (srcUrl: string): Promise<AudioBuffer> => {
  const response = await fetch(srcUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Decode audio data (this might take a moment for large files)
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Clean up context to save resources
  audioContext.close();

  return audioBuffer;
};

/**
 * Slices a segment from an AudioBuffer and returns it as a WAV Blob.
 *
 * @param buffer - The source AudioBuffer
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @returns Blob (audio/wav)
 */
export const sliceAudioBuffer = (buffer: AudioBuffer, startTime: number, endTime: number): Blob => {
  const sampleRate = buffer.sampleRate;
  const startOffset = Math.max(0, Math.floor(startTime * sampleRate));
  const endOffset = Math.min(buffer.length, Math.floor(endTime * sampleRate));
  const frameCount = endOffset - startOffset;

  if (frameCount <= 0) {
    return new Blob([], { type: 'audio/wav' });
  }

  // Create a new buffer for the slice
  const numberOfChannels = buffer.numberOfChannels;
  const sliceBuffer = new AudioContext().createBuffer(numberOfChannels, frameCount, sampleRate);

  // Copy data
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    const sliceData = sliceBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      sliceData[i] = channelData[i + startOffset];
    }
  }

  return bufferToWav(sliceBuffer);
};

/**
 * Encodes an AudioBuffer to WAV format (Blob).
 *
 * Based on standard RIFF WAVE encoding logic.
 */
function bufferToWav(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // Write WAV Header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this converter)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // Write Interleaved Data
  for (i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < abuffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // clamp
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      // scale to 16-bit signed int
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(offset, data, true);
    offset += 2;
  }

  function setUint32(data: number) {
    view.setUint32(offset, data, true);
    offset += 4;
  }
}