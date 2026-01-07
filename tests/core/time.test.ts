import { describe, it, expect } from 'vitest';
import { formatTime, parseVTTTime } from '../../core/time';

describe('Time Utilities', () => {
  describe('formatTime', () => {
    it('formats seconds into MM:SS', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(59)).toBe('00:59');
    });

    it('formats seconds into H:MM:SS for longer durations', () => {
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(3665)).toBe('1:01:05');
    });
  });

  describe('parseVTTTime', () => {
    it('parses standard HH:MM:SS.mmm format', () => {
      expect(parseVTTTime('00:00:10.500')).toBe(10.5);
      expect(parseVTTTime('01:00:00.000')).toBe(3600);
    });

    it('parses MM:SS.mmm format', () => {
      expect(parseVTTTime('01:30.500')).toBe(90.5);
    });

    it('handles comma separators (SRT style)', () => {
      expect(parseVTTTime('00:00:05,500')).toBe(5.5);
    });
  });
});