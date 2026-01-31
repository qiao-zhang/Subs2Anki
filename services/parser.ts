import { SubtitleLine } from './types.ts';
import { parseTimestamp, formatTimestamp } from './time.ts';

/**
 * Parses raw subtitle file content (SRT or VTT) into structured objects.
 *
 * This parser is designed to be robust against slight format variations.
 * It handles both standard SRT (index -> time -> text) and VTT formats.
 *
 * @param content - The raw text content of the subtitle file
 * @returns Array of Subtitle objects
 */
export const parseSubtitles = (content: string): SubtitleLine[] => {
  // Normalize line endings to LF to handle Windows/Linux differences
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by double newlines, which standardly separate subtitle blocks
  const blocks = normalized.split('\n\n');

  const subtitles: SubtitleLine[] = [];
  let idCounter = 1;

  blocks.forEach(block => {
    if (!block.trim()) return;

    const lines = block.split('\n');
    if (lines.length < 2) return;

    // Heuristic: Check if first line is just a number.
    // SRT files start with an index number. VTT files might not.
    const timeLineIndex = lines[0].match(/^\d+$/) ? 1 : 0;

    const timeLine = lines[timeLineIndex];
    // Verify it looks like a timeline (contains the arrow '-->')
    if (!timeLine || !timeLine.includes('-->')) return;

    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
    const startTime = parseTimestamp(startStr);
    const endTime = parseTimestamp(endStr);

    // Everything after the timeline is considered the dialogue text.
    // We join multi-line text into a single string and strip HTML tags (like <i> or <b>).
    const text = lines.slice(timeLineIndex + 1)
      .join(' ')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();

    if (text) {
      subtitles.push({
        id: idCounter++,
        startTime,
        endTime,
        text,
        locked: false // Default to unlocked
      });
    }
  });

  return subtitles;
};

/**
 * Serializes subtitle objects back into a string format (SRT or VTT).
 * 
 * @param subtitles - Array of subtitle lines
 * @param format - 'srt' or 'vtt'
 * @returns Formatted string content
 */
export const serializeSubtitles = (subtitles: SubtitleLine[], format: 'srt' | 'vtt'): string => {
  let output = '';
  
  if (format === 'vtt') {
    output += 'WEBVTT\n\n';
    subtitles.forEach(sub => {
       output += `${formatTimestamp(sub.startTime)} --> ${formatTimestamp(sub.endTime)}\n`;
       output += `${sub.text}\n\n`;
    });
  } else {
    // SRT
    subtitles.forEach((sub, index) => {
      output += `${index + 1}\n`;
      output += `${formatTimestamp(sub.startTime, 'comma')} --> ${formatTimestamp(sub.endTime, 'comma')}\n`;
      output += `${sub.text}\n\n`;
    });
  }
  
  return output;
};