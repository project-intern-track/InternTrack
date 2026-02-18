import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';

export type Evaluation = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
};

const Evaluations = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // Fetch Supabase evaluations
  useEffect(() => {
    if (!user) return;

    const fetchEvaluations = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: Evaluation[] = (data as any[]).map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          due_date: t.due_date || new Date().toISOString(),
          priority: t.priority || 'Medium',
          status: t.status === 'done' ? 'Completed' : t.status === 'in-progress' ? 'In Progress' : 'Pending',
        }));
        setEvaluations(mapped);
      }
    };

    fetchEvaluations();
  }, [user]);

  // Summary calculations
  const totalEvaluated = evaluations.filter(e => e.status === 'Completed').length;
  const averageCompletion = evaluations.length > 0 ? (totalEvaluated / evaluations.length) * 100 : 0;
  const improvementTrend = totalEvaluated;

  return (
    <div style={{ maxWidth: '2000px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ color: '#ff8c42' }}>Evaluations</h1>
      {user && <p>Logged in as: <strong>{user.name || user.email}</strong></p>}
      <p style={{ color: '#555' }}>Manage evaluations for interns here.</p>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {[
          { label: 'Total Interns Evaluated', value: totalEvaluated },
          { label: 'Average Task Completion', value: `${averageCompletion.toFixed(0)}%` },
          { label: 'Improvement Trend', value: improvementTrend },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#ffffff',
              textAlign: 'center',
              border: '1px solid #ccc',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '120px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#555' }}>{item.label}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Evaluations;
