import { useEffect, useRef } from 'react';

type RealtimeTable =
  | 'announcements'
  | 'tasks'
  | 'attendance'
  | 'evaluations'
  | 'users'
  | 'user_settings';

/**
 * useRealtime – polls at a fixed interval and calls `onChanged` to refresh data.
 *
 * Replaces the previous Supabase realtime subscription with simple polling.
 * The API signature is kept identical so existing consumers don't need changes.
 *
 * Usage:
 *   useRealtime('announcements', fetchAnnouncements);
 *   useRealtime(['tasks', 'users'], fetchDashboardData);
 *
 * @param _tables  Table name(s) – kept for API compatibility but unused.
 * @param onChanged  Callback invoked every polling interval.
 * @param intervalMs  Polling interval in milliseconds (default: 30 000).
 */
export function useRealtime(
  _tables: RealtimeTable | RealtimeTable[],
  onChanged: () => void,
  intervalMs = 30_000
): void {
  // Keep a stable ref so we don't restart the interval when the callback identity changes
  const callbackRef = useRef(onChanged);
  useEffect(() => {
    callbackRef.current = onChanged;
  }, [onChanged]);

  useEffect(() => {
    const id = setInterval(() => {
      callbackRef.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);
}
