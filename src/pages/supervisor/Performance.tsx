import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';

const InternPerformance = () => {
  const { user } = useAuth();
  const [interns, setInterns] = useState<any[]>([]);

  const fetchInterns = useCallback(async () => {
    if (!user) return;

    // Get all interns
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('role', 'intern');

    if (error) return;

    // For each intern, count completed tasks
    const results = await Promise.all(
      (users || []).map(async intern => {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact' })
          .eq('assigned_to', intern.id)
          .eq('status', 'done');
        return { ...intern, completedTasks: count || 0 };
      })
    );

    setInterns(results);
  }, [user]);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  // Re-fetch whenever users or tasks change in real-time
  useRealtime(['users', 'tasks'], fetchInterns);

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
