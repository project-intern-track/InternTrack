import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeInterns: 0,
    logsToReview: 0,
    pendingApprovals: 0,
    feedbackRequests: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const { count: activeInterns } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', 'intern');

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

      setStats({
        activeInterns: activeInterns || 0,
        logsToReview: logsToReview || 0,
        pendingApprovals: pendingApprovals || 0,
        feedbackRequests: feedbackRequests || 0,
      });
    };

    fetchStats();
  }, [user]);

  return (
    <div>
      <h1>Welcome back, {user?.name || user?.name}</h1>
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
