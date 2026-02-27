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
  review: '#098d40',
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
  const [activeTab, setActiveTab] =
    useState<'review' | 'approved' | 'Needs Revision' | 'Rejected'>('review');

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Design Login Page', description: 'Create UI for login', assignedIntern: 'Juan Dela Cruz', due_date: '2026-02-20', priority: 'High Priority', status: 'review' },
    { id: '2', title: 'Setup Database', description: 'Initialize Supabase DB', assignedIntern: 'Maria Santos', due_date: '2026-02-19', priority: 'Medium Priority', status: 'done' },
    { id: '3', title: 'Write Test Cases', description: 'Add unit tests', assignedIntern: 'Carlo Reyes', due_date: '2026-02-22', priority: 'Low Priority', status: 'Needs Revision', revisionReason: 'Incomplete test cases', revisionCategory: 'Incomplete task details' },
    { id: '4', title: 'Dashboard Layout', description: 'Create dashboard grid layout', assignedIntern: 'Angela Lim', due_date: '2026-02-21', priority: 'High Priority', status: 'review' },
    { id: '5', title: 'Email Notifications', description: 'Integrate email alerts', assignedIntern: 'Juan Dela Cruz', due_date: '2026-02-18', priority: 'Medium Priority', status: 'Rejected' },
  ]);

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
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: '#ff8c42', fontSize: 'clamp(1.5rem, 2vw, 2rem)' }}>
        Supervisor Panel
      </h1>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '1rem',
          padding: '1.5rem',
          backgroundColor: '#e8ddd0',
          marginTop: '1rem',
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
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
                flex: '1 1 200px',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: activeTab === tab.key ? '2px solid black' : '1px solid #ccc',
                backgroundColor: activeTab === tab.key ? '#ebab5d' : '#fff',
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
                  padding: '1.5rem',
                  backgroundColor: '#fff',
                  position: 'relative',
                }}
              >
                {/* Priority Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: priorityColors[task.priority],
                    }}
                  />
                  {task.priority}
                </div>

                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p><strong>Assigned to:</strong> {task.assignedIntern}</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </p>

                {activeTab === 'review' ? (
                  <div
                    style={{
                      marginTop: '1rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <button
                      onClick={() => openRevisionModal(task)}
                      style={{
                        flex: '1 1 140px',
                        backgroundColor: '#eba72a',
                        color: '#fff',
                        border: 'none',
                        padding: '0.6rem',
                        borderRadius: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
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
                        flex: '1 1 120px',
                        backgroundColor: '#098d40',
                        color: '#fff',
                        border: 'none',
                        padding: '0.6rem',
                        borderRadius: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
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
                        flex: '1 1 120px',
                        backgroundColor: '#d32f2f',
                        color: '#fff',
                        border: 'none',
                        padding: '0.6rem',
                        borderRadius: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: '1rem' }}>
                    <span
                      style={{
                        backgroundColor: statusColors[task.status],
                        color: '#fff',
                        fontWeight: 'bold',
                        padding: '0.4rem 0.9rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                      }}
                    >
                      {task.status === 'done' ? 'Approved' : task.status}
                    </span>

                    {task.revisionReason && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem',
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
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '2rem',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '0.75rem',
              position: 'relative',
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.75rem',
                border: 'none',
                background: 'transparent',
                fontSize: '1.2rem',
                cursor: 'pointer',
              }}
            >
              ×
            </button>

            <h2>Request Revision</h2>

            <textarea
              placeholder="Enter the reason for revision"
              style={{
                width: '100%',
                minHeight: '100px',
                marginTop: '1rem',
                padding: '0.5rem',
              }}
              value={selectedTask.revisionReason || ''}
              onChange={e =>
                setSelectedTask(prev =>
                  prev && { ...prev, revisionReason: e.target.value }
                )
              }
            />

            <select
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '1rem',
              }}
              value={selectedTask.revisionCategory || 'Other'}
              onChange={e =>
                setSelectedTask(prev =>
                  prev && { ...prev, revisionCategory: e.target.value }
                )
              }
            >
              <option>Other</option>
              <option>Incomplete task details</option>
              <option>Incorrect intern assignment</option>
              <option>Deadline needs adjustment</option>
              <option>Not aligned with objectives</option>
              <option>Duplicate task</option>
            </select>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                marginTop: '1.5rem',
                flexWrap: 'wrap',
              }}
            >
              <button onClick={closeModal}>Cancel</button>
              <button
                onClick={() => {
                  if (selectedTask) {
                    setTasks(prev =>
                      prev.map(t =>
                        t.id === selectedTask.id
                          ? {
                              ...t,
                              status: 'Needs Revision',
                              revisionReason: selectedTask.revisionReason,
                              revisionCategory: selectedTask.revisionCategory,
                            }
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
                  padding: '0.5rem 1rem',
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