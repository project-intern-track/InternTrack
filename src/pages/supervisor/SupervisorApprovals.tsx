import { useState } from 'react';

type Task = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High'; // new field
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
  const [search, setSearch] = useState('');

  const toReview = sampleTasks.filter(t => t.status === 'review');
  const approved = sampleTasks.filter(t => t.status === 'done');
  const rejected = sampleTasks.filter(t => t.status === 'rejected');

  const filteredTasks = (tasks: Task[]) =>
    tasks.filter(
      t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
    );

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'review': return filteredTasks(toReview);
      case 'approved': return filteredTasks(approved);
      case 'rejected': return filteredTasks(rejected);
    }
  };

  // Priority badge colors
  const priorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return '#e74c3c';
      case 'Medium': return '#f39c12';
      case 'Low': return '#2ecc71';
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <h1>Approve Tasks</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="🔍 Search tasks..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid #ccc',
          marginBottom: '1rem',
        }}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'review', label: 'To be Reviewed', count: toReview.length },
          { key: 'approved', label: 'Approved', count: approved.length },
          { key: 'rejected', label: 'Rejected', count: rejected.length },
        ].map(tab => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'review' | 'approved' | 'rejected')}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '0.75rem',
              border: activeTab === tab.key ? '2px solid hsl(200, 70%, 50%)' : '1px solid #ccc',
              backgroundColor: activeTab === tab.key ? 'hsl(200, 70%, 95%)' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{tab.label}</span>
            <span style={{
              backgroundColor: 'hsl(200, 70%, 50%)',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontWeight: 'bold',
            }}>
              {tab.count}
            </span>
          </div>
        ))}
      </div>

      {/* Task Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {getCurrentTasks().length === 0 ? (
          <p>No tasks here</p>
        ) : (
          getCurrentTasks().map(task => (
            <div
              key={task.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '0.5rem',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.5rem',
                position: 'relative',
              }}
            >
              {/* Top-right priority badge */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <span style={{
                  backgroundColor: priorityColor(task.priority),
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

              {/* Approve/Reject buttons */}
              {activeTab === 'review' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    Reject
                  </button>
                  <button
                    style={{
                      backgroundColor: '#2ecc71',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    Approve
                  </button>
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
  );
};

export default SupervisorApprovals;
