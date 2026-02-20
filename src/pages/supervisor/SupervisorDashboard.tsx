import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';

const SupervisorDashboard = () => {
  const { user } = useAuth();

  // Added value being fetched can be null
  const [stats, setStats] = useState<{
    activeInterns: number;
    logsToReview: number;
    pendingApprovals: number;
    feedbackRequests: number;
  } | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      // Fetching data from Supabase
      // Only count email-verified interns as "active" via secure RPC
      const { data: verifiedCount } = await supabase
        .rpc('get_verified_active_intern_count');
      const activeInterns = Number(verifiedCount ?? 0);

      const { count: logsToReview } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('status', 'review');

      const { count: pendingApprovals } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('status', 'todo');

      const { count: feedbackRequests } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('status', 'done');

      // Set Active Status
      setStats({
        activeInterns: activeInterns || 0,
        logsToReview: logsToReview || 0,
        pendingApprovals: pendingApprovals || 0,
        feedbackRequests: feedbackRequests || 0,
      });

    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Re-fetch whenever users or tasks change in real-time
  useRealtime(['users', 'tasks'], fetchStats);

  // This prevents the page from showing "0" while waiting for Supabase.
  if (!stats) return null; 

  return (
      <div>
        <h1>Welcome back, {user?.name}</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Supervisor Dashboard</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          <div className="card">
            <h3>Active Interns</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.activeInterns}</p>
          </div>
          <div className="card">
            <h3>Logs to Review</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.logsToReview}</p>
          </div>
          <div className="card">
            <h3>Pending Approvals</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.pendingApprovals}</p>
          </div>
          <div className="card">
            <h3>Feedback Requests</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.feedbackRequests}</p>
          </div>
        </div>
      </div>
    );
  };

export default SupervisorDashboard;