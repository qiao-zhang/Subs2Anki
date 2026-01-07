import { Subtitle } from './types';
import { parseVTTTime } from './time';

export const parseSubtitles = (content: string): Subtitle[] => {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split('\n\n');
  
  const subtitles: Subtitle[] = [];
  let idCounter = 1;

  blocks.forEach(block => {
    if (!block.trim()) return;
    
    const lines = block.split('\n');
    if (lines.length < 2) return;

    let timeLineIndex = 0;
    
    // Check if first line is just a number (SRT index)
    if (lines[0].match(/^\d+$/)) {
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    if (!timeLine || !timeLine.includes('-->')) return;

    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
    const startTime = parseVTTTime(startStr);
    const endTime = parseVTTTime(endStr);

    // Join the rest of the lines as text
    const text = lines.slice(timeLineIndex + 1)
      .join(' ')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();

    if (text) {
      subtitles.push({
        id: idCounter++,
        startTime,
        endTime,
        text
      });
    }
  });

  return subtitles;
};