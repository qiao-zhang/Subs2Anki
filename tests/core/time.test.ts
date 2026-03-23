import { describe, it, expect } from 'vitest';
import { formatTimestamp, parseTimestamp } from '../../services/time.ts';

/**
 * Test Suite for Time Utilities.
 * 
 * Verifies the bidirectional conversion between:
 * 1. Seconds (number) -> Display string (MM:SS)
 * 2. Timestamp string (HH:MM:SS,mmm) -> Seconds (number)
 */
describe('Time Utilities', () => {
  
  // Test formatting logic (Seconds -> String)
  describe('formatTimestamp', () => {
    it('formats seconds into HH:MM:SS when milliseconds are trimmed', () => {
      // Edge case: 0 seconds
      expect(formatTimestamp(0, 'trim')).toBe('00:00:00');
      // Standard case: > 1 minute
      expect(formatTimestamp(65, 'trim')).toBe('00:01:05');
      // Boundary case: exactly 59 seconds
      expect(formatTimestamp(3665, 'trim', 1)).toBe('1:01:05');
    });

    it('formats seconds into subtitle timestamp strings', () => {
      // VTT style dot separator
      expect(formatTimestamp(10.5, 'dot')).toBe('00:00:10.500');
      // SRT files use commas (,) for milliseconds instead of dots (.)
      expect(formatTimestamp(5.5, 'comma')).toBe('00:00:05,500');
    });
  });

  // Test parsing logic (String -> Seconds)
  describe('parseTimestamp', () => {
    it('parses standard HH:MM:SS.mmm format', () => {
      // VTT style dot separator
      expect(parseTimestamp('00:00:10.500')).toBe(10.5);
      // Hours calculation
      expect(parseTimestamp('01:00:00.000')).toBe(3600);
    });

    it('parses MM:SS.mmm and comma-separated SRT timestamps', () => {
      // Short format often found in VTT or specific players
      expect(parseTimestamp('01:30.500')).toBe(90.5);
      // SRT files use commas (,) for milliseconds instead of dots (.)
      expect(parseTimestamp('00:00:05,500')).toBe(5.5);
    });
  });
});