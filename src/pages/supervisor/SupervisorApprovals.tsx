import { useState } from 'react';

type Task = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'rejected';
};

// Sample static tasks
const sampleTasks: Task[] = [
  { id: '1', title: 'Design Login Page', description: 'Create UI for login', due_date: '2026-02-20', priority: 'High', status: 'review' },
  { id: '2', title: 'Setup Database', description: 'Initialize Supabase DB', due_date: '2026-02-19', priority: 'Medium', status: 'done' },
  { id: '3', title: 'Write Test Cases', description: 'Add unit tests', due_date: '2026-02-22', priority: 'Low', status: 'rejected' },
  { id: '4', title: 'Dashboard Layout', description: 'Create dashboard grid layout', due_date: '2026-02-21', priority: 'High', status: 'review' },
  { id: '5', title: 'Email Notifications', description: 'Integrate email alerts', due_date: '2026-02-18', priority: 'Medium', status: 'done' },
];

const SupervisorApprovals = () => {
  const [activeTab, setActiveTab] = useState<'review' | 'approved' | 'rejected'>('review');

  const toReview = sampleTasks.filter(t => t.status === 'review');
  const approved = sampleTasks.filter(t => t.status === 'done');
  const rejected = sampleTasks.filter(t => t.status === 'rejected');

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'review': return toReview;
      case 'approved': return approved;
      case 'rejected': return rejected;
    }
  };

  return (
    <div style={{ maxWidth: '2000px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ color: '#ff8c42' }}>Approve Tasks</h1>

      {/* Big Container with Tabs and Tasks */}
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '1rem',
        padding: '1rem',
        backgroundColor: '#e8ddd0',
      }}>
        {/* Tabs on top */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {[
            { key: 'review', label: 'To be Reviewed', count: toReview.length },
            { key: 'approved', label: 'Approved', count: approved.length },
            { key: 'rejected', label: 'Rejected', count: rejected.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'review' | 'approved' | 'rejected')}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: activeTab === tab.key ? '2px solid hsl(0, 0%, 0%)' : '1px solid #cccccc00',
                backgroundColor: activeTab === tab.key ? '#ebab5d' : '#ffffff00',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                color:'#050505ab',
              }}
            >
              {`${tab.label} (${tab.count})`}
            </button>
          ))}
        </div>

        {/* Task Cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {getCurrentTasks().length === 0 ? (
            <p>No tasks here</p>
          ) : (
            getCurrentTasks().map(task => (
              <div
                key={task.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '1rem', 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  position: 'relative',
                  backgroundColor:'#ffffff'
                }}
              >
                {/* Priority text (top-right) */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  fontWeight: 'bold',
                  color: '#000',
                  fontSize: '0.85rem',
                  pointerEvents: 'none',
                }}>
                  {task.priority}
                </div>

                <div>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                </div>

                {/* Approve/Reject buttons bottom-right */}
                {activeTab === 'review' && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: 'auto',
                    justifyContent: 'flex-end',
                  }}>
                    <button style={{
                      backgroundColor: '#e74d3c93',
                      color: '#911709',
                      border: 'none',
                      fontWeight: 'bold',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}>Reject</button>
                    <button style={{
                      backgroundColor: '#2ecc71',
                      color: 'black',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      fontWeight: 'bold', 
                    }}>Approve</button>
                  </div>
                )}

                {/* Bottom-left due date */}
                <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorApprovals;
