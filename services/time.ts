/**
 * Formats seconds into precise subtitle timestamp format.
 * SRT: HH:MM:SS,mmm
 * VTT: HH:MM:SS.mmm
 */
export const formatTimestamp = (seconds: number,
                                millsMode: 'trim' | 'comma' | 'dot' = 'dot',
                                hourPad: 2 | 1 | 0 = 2,
                                ): string => {
  const totalMs = Math.round(seconds * 1000);
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  let millis = '';
  if (millsMode === 'comma') {
    millis = `,${pad(ms, 3)}`
  } else if (millsMode === 'dot') {
    millis = `.${pad(ms, 3)}`
  }

  return `${pad(h, hourPad)}:${pad(m, 2)}:${pad(s, 2)}${millis}`;
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
export const parseTimestamp = (timeString: string): number => {
  const parts = timeString.split(':').reverse();
  let seconds = 0;
  for (let i = 0; i < parts.length; i++) {
    seconds += parseFloat(parts[i].replace(',', '.')) * Math.pow(60, i);
  }
  return seconds;
};