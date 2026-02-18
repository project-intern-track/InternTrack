import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';

type Task = {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'rejected';
};

// Dummy/example tasks
const sampleTasks: Task[] = [
  { id: '1', title: 'Design Login Page', description: 'Create UI for login', due_date: '2026-02-20', priority: 'High', status: 'review' },
  { id: '2', title: 'Setup Database', description: 'Initialize Supabase DB', due_date: '2026-02-19', priority: 'Medium', status: 'done' },
  { id: '3', title: 'Write Test Cases', description: 'Add unit tests', due_date: '2026-02-22', priority: 'Low', status: 'rejected' },
  { id: '4', title: 'Dashboard Layout', description: 'Create dashboard grid layout', due_date: '2026-02-21', priority: 'High', status: 'review' },
  { id: '5', title: 'Email Notifications', description: 'Integrate email alerts', due_date: '2026-02-18', priority: 'Medium', status: 'done' },
];

const Approvals = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'review' | 'approved' | 'rejected'>('review');
  const [toReview, setToReview] = useState<Task[]>([]);
  const [approved, setApproved] = useState<Task[]>([]);
  const [rejected, setRejected] = useState<Task[]>([]);
  const [search, setSearch] = useState('');

  // Fetch tasks from Supabase or fallback to sample tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) {
        setToReview(sampleTasks.filter(t => t.status === 'review'));
        setApproved(sampleTasks.filter(t => t.status === 'done'));
        setRejected(sampleTasks.filter(t => t.status === 'rejected'));
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // fallback to sample tasks
        setToReview(sampleTasks.filter(t => t.status === 'review'));
        setApproved(sampleTasks.filter(t => t.status === 'done'));
        setRejected(sampleTasks.filter(t => t.status === 'rejected'));
        return;
      }

      const tasks = data as Task[];
      setToReview(tasks.filter(t => t.status === 'review'));
      setApproved(tasks.filter(t => t.status === 'done'));
      setRejected(tasks.filter(t => t.status === 'rejected'));
    };

    fetchTasks();
  }, [user]);

  // Approve task (optimistic)
  const handleApprove = async (task: Task) => {
    setToReview(prev => prev.filter(t => t.id !== task.id));
    setApproved(prev => [...prev, { ...task, status: 'done' }]);

    if (!user) return; // no Supabase update for dummies

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', task.id);

    if (error) {
      console.error('Failed to update task status:', error);
      setToReview(prev => [...prev, task]);
      setApproved(prev => prev.filter(t => t.id !== task.id));
    }
  };

  // Reject task (optimistic)
  const handleReject = async (task: Task) => {
    setToReview(prev => prev.filter(t => t.id !== task.id));
    setRejected(prev => [...prev, { ...task, status: 'rejected' }]);

    if (!user) return; // no Supabase update for dummies

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
    <div style={{ maxWidth: '2000px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ color: '#ff8c42' }}>Approve Tasks</h1>
      {user && <p>Logged in as: <strong>{user.name || user.email}</strong></p>}

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
              color: '#050505ab',
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
                backgroundColor: '#ffffff',
              }}
            >
              {/* Priority badge */}
              {task.priority && (
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
              )}

              <div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>

              {/* Approve/Reject buttons */}
              {activeTab === 'review' && (
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: 'auto',
                  justifyContent: 'flex-end',
                }}>
                  <button
                    onClick={() => handleReject(task)}
                    style={{
                      backgroundColor: '#e74d3c93',
                      color: '#911709',
                      border: 'none',
                      fontWeight: 'bold',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(task)}
                    style={{
                      backgroundColor: '#2ecc71',
                      color: 'black',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      fontWeight: 'bold',
                    }}
                  >
                    Approve
                  </button>
                </div>
              )}

              {/* Due date */}
              {task.due_date && (
                <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Approvals;
