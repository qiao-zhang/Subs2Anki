/**
 * Formats a duration in seconds into a standard HH:MM:SS or MM:SS string.
 * Used for displaying timestamps in the UI and on cards.
 * 
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g. "01:30" or "1:05:20")
 */
export const formatTime = (seconds: number): string => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const iso = date.toISOString().substr(11, 8);
  // Remove leading hours if 00 to make it look cleaner for shorter videos
  return iso.startsWith('00:') ? iso.slice(3) : iso;
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