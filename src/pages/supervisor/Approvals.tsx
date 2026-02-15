import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Task = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'rejected';
};

const Approvals = () => {
  const { user } = useAuth();

  const [toReview, setToReview] = useState<Task[]>([]);
  const [approved, setApproved] = useState<Task[]>([]);
  const [rejected, setRejected] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'review' | 'approved' | 'rejected'>('review');
  const [search, setSearch] = useState('');

  // Fetch tasks from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks') // no generic
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return;

      const tasks = data as Task[];

      setToReview(tasks.filter(t => t.status === 'review'));
      setApproved(tasks.filter(t => t.status === 'done'));
      setRejected(tasks.filter(t => t.status === 'rejected'));
    };

    fetchTasks();
  }, [user]);

  // Approve task (optimistic update)
  const handleApprove = async (task: Task) => {
    setToReview(prev => prev.filter(t => t.id !== task.id));
    setApproved(prev => [...prev, { ...task, status: 'done' }]);

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', task.id);

    if (error) {
      console.error('Failed to update task status:', error);
      // rollback if needed
      setToReview(prev => [...prev, task]);
      setApproved(prev => prev.filter(t => t.id !== task.id));
    }
  };

  // Reject task (optimistic update)
  const handleReject = async (task: Task) => {
    setToReview(prev => prev.filter(t => t.id !== task.id));
    setRejected(prev => [...prev, { ...task, status: 'rejected' }]);

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'rejected' })
      .eq('id', task.id);

    if (error) {
      console.error('Failed to update task status:', error);
      setToReview(prev => [...prev, task]);
      setRejected(prev => prev.filter(t => t.id !== task.id));
    }
  };

  // Filter tasks by search
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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <h1>Approve Tasks</h1>
      {user && <p>Logged in as: <strong>{user.name || user.name}</strong></p>}

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

      {/* Tabs as card containers */}
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
                gap: '0.5rem',
              }}
            >
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              {activeTab === 'review' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => handleReject(task)}
                    style={{
                      border: '1px solid #ccc',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(task)}
                    style={{
                      border: '1px solid #ccc',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Approvals;
