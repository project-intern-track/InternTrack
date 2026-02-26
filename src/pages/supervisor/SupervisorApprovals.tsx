import { useState } from 'react';

type Status = 'review' | 'done' | 'Needs Revision' | 'Rejected';

type Task = {
  id: string;
  title: string;
  description: string;
  assignedIntern: string;
  due_date: string;
  priority: 'Low Priority' | 'Medium Priority' | 'High Priority';
  status: Status;
  revisionReason?: string;
  revisionCategory?: string;
};

const statusColors: Record<Status, string> = {
  review: '#098d40', // not used directly
  done: '#098d40',
  'Needs Revision': '#eba72a',
  Rejected: '#d32f2f',
};

const priorityColors: Record<string, string> = {
  'Low Priority': '#01788d',
  'Medium Priority': '#f3c743',
  'High Priority': '#ac2e25',
};

const SupervisorApprovals = () => {
  const [activeTab, setActiveTab] = useState<'review' | 'approved' | 'Needs Revision' | 'Rejected'>('review');

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Design Login Page', description: 'Create UI for login', assignedIntern: 'Juan Dela Cruz', due_date: '2026-02-20', priority: 'High Priority', status: 'review' },
    { id: '2', title: 'Setup Database', description: 'Initialize Supabase DB', assignedIntern: 'Maria Santos', due_date: '2026-02-19', priority: 'Medium Priority', status: 'done' },
    { id: '3', title: 'Write Test Cases', description: 'Add unit tests', assignedIntern: 'Carlo Reyes', due_date: '2026-02-22', priority: 'Low Priority', status: 'Needs Revision', revisionReason: 'Incomplete test cases', revisionCategory: 'Incomplete task details' },
    { id: '4', title: 'Dashboard Layout', description: 'Create dashboard grid layout', assignedIntern: 'Angela Lim', due_date: '2026-02-21', priority: 'High Priority', status: 'review' },
    { id: '5', title: 'Email Notifications', description: 'Integrate email alerts', assignedIntern: 'Juan Dela Cruz', due_date: '2026-02-18', priority: 'Medium Priority', status: 'Rejected' },
  ]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const openRevisionModal = (task: Task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setShowModal(false);
  };

  const filteredTasks =
    activeTab === 'review'
      ? tasks.filter(t => t.status === 'review')
      : activeTab === 'approved'
      ? tasks.filter(t => t.status === 'done')
      : activeTab === 'Needs Revision'
      ? tasks.filter(t => t.status === 'Needs Revision')
      : tasks.filter(t => t.status === 'Rejected');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ color: '#ff8c42' }}>Supervisor Panel</h1>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '1rem',
          padding: '1rem',
          backgroundColor: '#e8ddd0',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {[
            { key: 'review', label: 'To be Reviewed', count: tasks.filter(t => t.status === 'review').length },
            { key: 'approved', label: 'Approved', count: tasks.filter(t => t.status === 'done').length },
            { key: 'Needs Revision', label: 'Needs Revision', count: tasks.filter(t => t.status === 'Needs Revision').length },
            { key: 'Rejected', label: 'Rejected', count: tasks.filter(t => t.status === 'Rejected').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: activeTab === tab.key ? '2px solid black' : 'none',
                backgroundColor: activeTab === tab.key ? '#ebab5d' : 'transparent',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {`${tab.label} (${tab.count})`}
            </button>
          ))}
        </div>

        {/* Task Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredTasks.length === 0 ? (
            <p>No tasks here</p>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '1rem',
                  padding: '1rem',
                  position: 'relative',
                  backgroundColor: '#fff',
                }}
              >
                {/* Priority Indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '999px',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: priorityColors[task.priority],
                      display: 'inline-block',
                    }}
                  />
                  {task.priority}
                </div>

                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p><strong>Assigned to:</strong> {task.assignedIntern}</p>

                {/* Review Tab = Buttons */}
                {activeTab === 'review' ? (
                  <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => openRevisionModal(task)}
                      style={{
                        backgroundColor: '#eba72a',
                        color: '#fff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginRight: '0.5rem',
                      }}
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() =>
                        setTasks(prev =>
                          prev.map(t => (t.id === task.id ? { ...t, status: 'done' } : t))
                        )
                      }
                      style={{
                        backgroundColor: '#098d40',
                        color: '#fff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginRight: '0.5rem',
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        setTasks(prev =>
                          prev.map(t => (t.id === task.id ? { ...t, status: 'Rejected' } : t))
                        )
                      }
                      style={{
                        backgroundColor: '#d32f2f',
                        color: '#fff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  /* Other Tabs = Status Badge & Revision Info */
                  <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                    <span
                      style={{
                        backgroundColor: statusColors[task.status],
                        color: '#fff',
                        fontWeight: 'bold',
                        padding: '0.4rem 0.9rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        opacity: 0.9,
                      }}
                    >
                      {task.status === 'done' ? 'Approved' : task.status}
                    </span>

                    {/* Show revision details if present */}
                    {task.revisionReason && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          border: '1px solid #ccc',
                          borderRadius: '0.5rem',
                          backgroundColor: '#fff3e0',
                        }}
                      >
                        <p><strong>Revision Reason:</strong> {task.revisionReason}</p>
                        <p><strong>Revision Category:</strong> {task.revisionCategory}</p>
                      </div>
                    )}
                  </div>
                )}

                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Due: {new Date(task.due_date).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= MODAL POP-UP ================= */}
      {showModal && selectedTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '2rem',
              width: '450px',
              borderRadius: '0.5rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                border: 'none',
                background: 'transparent',
                fontSize: '1.2rem',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              x
            </button>

            <h2 style={{ marginBottom: '1rem' }}>Request Revision</h2>

            <h4>Revision Reason:</h4>
            <textarea
              placeholder="Enter the reason for revision here"
              style={{ width: '100%', height: '100px', marginBottom: '1rem', padding: '0.5rem' }}
              onChange={e =>
                setSelectedTask(prev => prev && { ...prev, revisionReason: e.target.value })
              }
              value={selectedTask.revisionReason || ''}
            />

            <h4>Revision Category:</h4>
            <select
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
              onChange={e =>
                setSelectedTask(prev => prev && { ...prev, revisionCategory: e.target.value })
              }
              value={selectedTask.revisionCategory || 'Other'}
            >
              <option>Other</option>
              <option>Incomplete task details</option>
              <option>Incorrect intern assignment</option>
              <option>Deadline needs adjustment</option>
              <option>Not aligned with objectives</option>
              <option>Duplicate task</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0.3rem',
                  border: '1px solid #ccc',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedTask) {
                    setTasks(prev =>
                      prev.map(t =>
                        t.id === selectedTask.id
                          ? { ...t, status: 'Needs Revision', revisionReason: selectedTask.revisionReason, revisionCategory: selectedTask.revisionCategory }
                          : t
                      )
                    );
                  }
                  closeModal();
                }}
                style={{
                  background: '#FB8C00',
                  color: '#fff',
                  border: 'none',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0.3rem',
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorApprovals;