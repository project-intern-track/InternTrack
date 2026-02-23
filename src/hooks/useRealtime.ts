import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

type RealtimeTable =
  | 'announcements'
  | 'tasks'
  | 'attendance'
  | 'evaluations'
  | 'users'
  | 'user_settings';

/**
 * useRealtime – subscribes to INSERT / UPDATE / DELETE events on one or more
 * Supabase tables and calls `onChanged` whenever any row changes.
 *
 * Usage:
 *   useRealtime('announcements', fetchAnnouncements);
 *   useRealtime(['tasks', 'users'], fetchDashboardData);
 */
export function useRealtime(
  tables: RealtimeTable | RealtimeTable[],
  onChanged: () => void
): void {
  // Keep a stable ref so we don't re-subscribe when the callback identity changes
  const callbackRef = useRef(onChanged);
  useEffect(() => {
    callbackRef.current = onChanged;
  }, [onChanged]);

  useEffect(() => {
    const tableList = Array.isArray(tables) ? tables : [tables];
    const channelName = `realtime:${tableList.join(',')}:${Math.random()}`;

    const channel = supabase.channel(channelName);

    tableList.forEach((table) => {
      channel.on(
        // @ts-ignore – postgres_changes is a valid event
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          callbackRef.current();
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(Array.isArray(tables) ? tables : [tables])]);
}
