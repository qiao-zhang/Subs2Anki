import { describe, it, expect } from 'vitest';
import { parseSubtitles } from '../../core/parser';

describe('Subtitle Parser', () => {
  it('parses standard SRT content correctly', () => {
    const srtContent = `
1
00:00:01,000 --> 00:00:04,000
Hello World

2
00:00:05,000 --> 00:00:08,000
This is a <b>test</b>
    `.trim();

    const result = parseSubtitles(srtContent);
    
    expect(result).toHaveLength(2);
    
    expect(result[0]).toEqual({
      id: 1,
      startTime: 1,
      endTime: 4,
      text: 'Hello World'
    });

    // Checks HTML tag stripping
    expect(result[1].text).toBe('This is a test');
    expect(result[1].startTime).toBe(5);
  });

  it('parses VTT content correctly', () => {
    const vttContent = `WEBVTT

00:00:01.000 --> 00:00:04.000
Hello VTT

00:00:05.000 --> 00:00:08.000
Line 2
    `;

    const result = parseSubtitles(vttContent);
    
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Hello VTT');
  });

  it('handles empty or malformed input gracefully', () => {
    expect(parseSubtitles('')).toEqual([]);
    expect(parseSubtitles('Malformed garbage\nNo timestamps')).toEqual([]);
  });
});