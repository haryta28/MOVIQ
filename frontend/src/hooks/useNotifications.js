import { useEffect, useState, useCallback } from 'react';
import api from '../api';

const LAST_SEEN_KEY = 'moviq_notif_last_seen';

export default function useNotifications(pollMs = 30000) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const computeUnread = useCallback((list) => {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
    if (!lastSeen) return list.length;
    return list.filter(n => (n.createdAt || '') > lastSeen).length;
  }, []);

  const fetchNow = useCallback(async () => {
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data);
      setUnread(computeUnread(r.data));
    } catch (_) { /* ignore */ }
  }, [computeUnread]);

  const markAllSeen = useCallback(() => {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setUnread(0);
  }, []);

  useEffect(() => {
    fetchNow();
    const id = setInterval(fetchNow, pollMs);
    return () => clearInterval(id);
  }, [fetchNow, pollMs]);

  return { notifications, unread, markAllSeen, refresh: fetchNow };
}
