import { describe, it, expect } from 'vitest';
import { formatTime, parseVTTTime } from '@/core/time.ts';

/**
 * Test Suite for Time Utilities.
 * 
 * Verifies the bidirectional conversion between:
 * 1. Seconds (number) -> Display string (MM:SS)
 * 2. Timestamp string (HH:MM:SS,mmm) -> Seconds (number)
 */
describe('Time Utilities', () => {
  
  // Test formatting logic (Seconds -> String)
  describe('formatTime', () => {
    it('formats seconds into MM:SS', () => {
      // Edge case: 0 seconds
      expect(formatTime(0)).toBe('00:00');
      // Standard case: > 1 minute
      expect(formatTime(65)).toBe('01:05');
      // Boundary case: exactly 59 seconds
      expect(formatTime(59)).toBe('00:59');
    });

    it('formats seconds into H:MM:SS for longer durations', () => {
      // Exact hour
      expect(formatTime(3600)).toBe('1:00:00');
      // Hour + Minute + Seconds
      expect(formatTime(3665)).toBe('1:01:05');
    });
  });

  // Test parsing logic (String -> Seconds)
  describe('parseVTTTime', () => {
    it('parses standard HH:MM:SS.mmm format', () => {
      // VTT style dot separator
      expect(parseVTTTime('00:00:10.500')).toBe(10.5);
      // Hours calculation
      expect(parseVTTTime('01:00:00.000')).toBe(3600);
    });

    it('parses MM:SS.mmm format', () => {
      // Short format often found in VTT or specific players
      expect(parseVTTTime('01:30.500')).toBe(90.5);
    });

    it('handles comma separators (SRT style)', () => {
      // SRT files use commas (,) for milliseconds instead of dots (.)
      expect(parseVTTTime('00:00:05,500')).toBe(5.5);
    });
  });
});