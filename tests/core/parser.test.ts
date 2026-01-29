import { describe, it, expect } from 'vitest';
import { parseSubtitles } from '../../services/parser.ts';

/**
 * Test Suite for Subtitle Parsing.
 * 
 * Ensures the parser works robustly across:
 * 1. Standard SRT formats.
 * 2. WebVTT formats.
 * 3. HTML tag stripping within subtitles.
 * 4. Malformed inputs.
 */
describe('Subtitle Parser', () => {
  it('parses standard SRT content correctly', () => {
    // Mock SRT content with index numbers and comma timestamps
    const srtContent = `
1
00:00:01,000 --> 00:00:04,000
Hello World

2
00:00:05,000 --> 00:00:08,000
This is a <b>test</b>
    `.trim();

    const result = parseSubtitles(srtContent);
    
    // Validate structural integrity
    expect(result).toHaveLength(2);
    
    // Validate specific data mapping
    expect(result[0]).toEqual({
      id: 1,
      startTime: 1,
      endTime: 4,
      text: 'Hello World'
    });

    // Validate HTML tag stripping (<b>test</b> -> test) and timestamp parsing
    expect(result[1].text).toBe('This is a test');
    expect(result[1].startTime).toBe(5);
  });

  it('parses VTT content correctly', () => {
    // Mock VTT content with dot timestamps and optional header
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
    // Should return empty array instead of crashing
    expect(parseSubtitles('')).toEqual([]);
    expect(parseSubtitles('Malformed garbage\nNo timestamps')).toEqual([]);
  });
});