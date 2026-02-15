import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const Feedback = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchFeedback = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'done'); // Only completed tasks may have feedback

      if (!error) setTasks(data || []);
    };

    fetchFeedback();
  }, [user]);

  return (
    <div>
      <h1>Feedback</h1>
      {user && <p>Logged in as: <strong>{user.name || user.name}</strong></p>}

      <p>Provide or review feedback for interns here.</p>

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

export default Feedback;
