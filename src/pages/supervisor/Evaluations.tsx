import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const Evaluations = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchEvaluations = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setTasks(data || []);
    };

    fetchEvaluations();
  }, [user]);

  return (
    <div>
      <h1>Evaluations</h1>
      {user && <p>Logged in as: <strong>{user.name || user.name}</strong></p>}

      <p>Manage evaluations for interns here.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {tasks.map(task => (
          <div key={task.id} className="card" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <p>Status: {task.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Evaluations;
