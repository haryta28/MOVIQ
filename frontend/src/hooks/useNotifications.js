import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api';

const LAST_SEEN_KEY = 'moviq_notif_last_seen';

export default function useNotifications(pollMs = 30000) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const mountedRef                        = useRef(true);

  const computeUnread = useCallback((list) => {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
    if (!lastSeen) return list.length;
    return list.filter(n => (n.createdAt || '') > lastSeen).length;
  }, []);

  const fetchNow = useCallback(async () => {
    const controller = new AbortController();
    try {
      const r = await api.get('/notifications', { signal: controller.signal });
      if (mountedRef.current) {
        setNotifications(r.data);
        setUnread(computeUnread(r.data));
      }
    } catch (err) {
      // Silently ignore abort cancellations — they are expected on unmount
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        // Non-critical — notifications fail silently
      }
    }
  }, [computeUnread]);

  const markAllSeen = useCallback(() => {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setUnread(0);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNow();
    const id = setInterval(fetchNow, pollMs);
    return () => {
      mountedRef.current = false;  // Prevent stale state updates after unmount
      clearInterval(id);
    };
  }, [fetchNow, pollMs]);

  return { notifications, unread, markAllSeen, refresh: fetchNow };
}
