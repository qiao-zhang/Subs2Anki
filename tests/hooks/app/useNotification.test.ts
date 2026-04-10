import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {useNotification} from '@/hooks/app/useNotification.ts';

describe('useNotification', () => {
  it('shows and auto-hides notification', () => {
    vi.useFakeTimers();
    const {result} = renderHook(() => useNotification({timeoutMs: 3000}));

    act(() => {
      result.current.showNotification('hello');
    });

    expect(result.current.notification.visible).toBe(true);
    expect(result.current.notification.text).toBe('hello');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.notification.visible).toBe(false);
    expect(result.current.notification.text).toBe('');

    vi.useRealTimers();
  });

  it('resets timer when showing another notification', () => {
    vi.useFakeTimers();
    const {result} = renderHook(() => useNotification({timeoutMs: 3000}));

    act(() => {
      result.current.showNotification('first');
    });
    act(() => {
      vi.advanceTimersByTime(2000);
      result.current.showNotification('second');
    });

    expect(result.current.notification.visible).toBe(true);
    expect(result.current.notification.text).toBe('second');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.notification.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.notification.visible).toBe(false);

    vi.useRealTimers();
  });
});

