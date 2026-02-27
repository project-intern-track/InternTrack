import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
// TODO: Migrate to apiClient — Supabase has been removed.
// import { apiClient } from '../../services/apiClient';
import { useRealtime } from '../../hooks/useRealtime';
import PageLoader from '../../components/PageLoader';

interface InternWithTasks {
  id: string | number;
  name: string;
  role: string;
  completedTasks: number;
}

const InternPerformance = () => {
  const { user } = useAuth();
  const [interns, setInterns] = useState<InternWithTasks[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterns = useCallback(async () => {
    if (!user) return;

    // TODO: Replace with apiClient calls once Laravel backend endpoints exist.
    // Example:
    //   const { data: users } = await apiClient.get('/users', { params: { role: 'intern' } });
    //   Then for each intern, fetch their completed task count.
    console.warn('Performance.tsx: fetchInterns() not yet migrated to Laravel backend.');
    setInterns([]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  // Re-fetch whenever users or tasks change
  useRealtime(['users', 'tasks'], fetchInterns);

  if (loading) return <PageLoader message="Loading performance data..." />;

  return (
    <div>
      <h1>Intern Performance</h1>
      {user && <p>Logged in as: <strong>{user.name || user.name}</strong></p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {interns.map(intern => (
          <div className="card" key={intern.id} style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}>
            <h3>{intern.name || intern.name}</h3>
            <p>Completed Tasks: {intern.completedTasks}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternPerformance;
