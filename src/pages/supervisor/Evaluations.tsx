import { useState } from 'react';

export type Evaluation = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
};

const Evaluations = () => {
  const [evaluations] = useState<Evaluation[]>([]);


  // Calculations
  const totalEvaluated = evaluations.filter(e => e.status === 'Completed').length;
  const averageCompletion = evaluations.length > 0 ? (totalEvaluated / evaluations.length) * 100 : 0;
  const improvementTrend = totalEvaluated; // Number of completed tasks (numeric trend)

  return (
    <div style={{ maxWidth: '2000px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ color: '#ff8c42' }}>Evaluations</h1>
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

      {/* Evaluation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {evaluations.length === 0 && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem' }}>No evaluations available</p>
        )}
        {evaluations.map(task => (
          <div key={task.id} style={{
            border: '1px solid #ccc',
            borderRadius: '0.5rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.5rem',
            position: 'relative',
          }}>
            {/* Top-right priority badge */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
              <span style={{
                backgroundColor: task.priority === 'High' ? '#e74c3c' : task.priority === 'Medium' ? '#f39c12' : '#2ecc71',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}>
                {task.priority}
              </span>
            </div>

            <div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
            </div>

            {/* Bottom section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Due: {new Date(task.due_date).toLocaleDateString()}</p>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: task.status === 'Completed' ? '#2ecc71' : task.status === 'In Progress' ? '#f39c12' : '#e74c3c',
              }}>
                {task.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Evaluations;
