import {useCallback, useRef, useState} from 'react';

export interface AppNotification {
  visible: boolean;
  text: string;
}

interface UseNotificationOptions {
  timeoutMs?: number;
}

export const useNotification = (options: UseNotificationOptions = {}) => {
  const {timeoutMs = 3000} = options;
  const [notification, setNotification] = useState<AppNotification>({visible: false, text: ''});
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const showNotification = useCallback((text: string) => {
    clearTimer();
    setNotification({visible: true, text});
    timerRef.current = window.setTimeout(() => {
      setNotification({visible: false, text: ''});
      timerRef.current = null;
    }, timeoutMs);
  }, [clearTimer, timeoutMs]);

  return {
    notification,
    setNotification,
    showNotification,
  };
};

