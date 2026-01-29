/**
 * Formats a duration in seconds into a standard HH:MM:SS or MM:SS string.
 * Used for displaying timestamps in the UI and on cards.
 * 
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g. "01:30" or "1:05:20")
 */
export const formatTime = (seconds: number): string => {
  // Use UTC based calculation to ensure consistent formatting regardless of local timezone
  const date = new Date(seconds * 1000);
  // Extract HH:mm:ss from ISO string (1970-01-01T00:00:00.000Z)
  // Indices: 11 is start of HH, 19 is start of . (ms)
  const iso = date.toISOString().substring(11, 19);
  // Remove leading hours if 00 to make it look cleaner for shorter videos
  return iso.startsWith('00:') ? iso.slice(3) : iso;
};

/**
 * Formats seconds into precise subtitle timestamp format.
 * SRT: HH:MM:SS,mmm
 * VTT: HH:MM:SS.mmm
 * 
 * @param seconds - Time in seconds
 * @param useComma - True for SRT (comma), False for VTT (dot)
 */
export const formatTimestamp = (seconds: number, useComma: boolean = false): string => {
  const totalMs = Math.round(seconds * 1000);
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  const separator = useComma ? ',' : '.';
  
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}${separator}${pad(ms, 3)}`;
};

/**
 * 计算时间差并格式化为字符串
 * @param start 开始时间（秒）
 * @param end 结束时间（秒）
 * @returns 格式化的时间差字符串
 */
export const formatTimeDifference = (start: number, end: number): string => {
  return (end - start).toFixed(2) + 's';
};

/**
 * Parses a VTT/SRT timestamp string into seconds.
 * Supports formats like "00:00:10.500" or "01:30.000".
 * 
 * @param timeString - The timestamp string from the subtitle file
 * @returns Total seconds as a float
 */
export const parseVTTTime = (timeString: string): number => {
  const parts = timeString.split(':').reverse();
  let seconds = 0;
  for (let i = 0; i < parts.length; i++) {
    seconds += parseFloat(parts[i].replace(',', '.')) * Math.pow(60, i);
  }
  return seconds;
};