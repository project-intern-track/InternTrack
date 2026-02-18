import { useState } from 'react';
import { Search, Filter, Eye, Edit, X, Pencil} from 'lucide-react';

type Intern = {
  name: string;
  role: string;
  feedback?: string;
};

type FeedbackTask = {
  id: string;
  taskName: string;
  taskDescription: string;
  completionDate: string;
  interns: Intern[];
  status: 'Pending' | 'Submitted';
};

// Dummy static data
const dummyTasks: FeedbackTask[] = [
  {
    id: '1',
    taskName: 'Project Report',
    taskDescription: 'Submit a detailed project report covering all milestones.',
    completionDate: '2026-02-22',
    interns: [{ name: 'Alice Tan', role: 'Developer', feedback: 'Well done!' }],
    status: 'Submitted',
  },
  {
    id: '2',
    taskName: 'Code Review',
    taskDescription: 'Review the assigned code repository for best practices.',
    completionDate: '2026-02-21',
    interns: [{ name: 'Bob Cruz', role: 'Developer' }],
    status: 'Pending',
  },
  {
    id: '3',
    taskName: 'Presentation',
    taskDescription: 'Prepare a 10-minute presentation on the project progress.',
    completionDate: '2026-02-25',
    interns: [{ name: 'Jay Jay Tan', role: 'Frontend' }],
    status: 'Pending',
  },
  {
    id: '4',
    taskName: 'Attendance Check',
    taskDescription: 'Mark attendance for the week and submit report.',
    completionDate: '2026-02-20',
    interns: [{ name: 'Mia Lopez', role: 'QA', feedback: 'All good' }],
    status: 'Submitted',
  },
];

const FeedbackDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tasks, setTasks] = useState<FeedbackTask[]>(dummyTasks);
  const [selectedTask, setSelectedTask] = useState<FeedbackTask | null>(null);

  // Filtered tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus ? task.status === filterStatus : true;
    return matchesSearch && matchesFilter;
  });

  const submittedCount = tasks.filter(t => t.status === 'Submitted').length;
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;

  // Handle feedback change
  const handleFeedbackChange = (internIndex: number, value: string) => {
    if (!selectedTask) return;
    const updatedTask = { ...selectedTask };
    updatedTask.interns[internIndex].feedback = value;
    setSelectedTask(updatedTask);
  };

  // Save feedback
  const saveFeedback = () => {
    if (!selectedTask) return;
    setTasks(prev =>
      prev.map(t => (t.id === selectedTask.id ? { ...selectedTask, status: 'Submitted' } : t))
    );
    setSelectedTask(null);
  };

  return (
    <div style={{ maxWidth: '2000px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ color: '#ff8c42' }}>Feedback</h1>
      <p style={{ color: '#555' }}>Overview of submitted and pending feedback for interns.</p>

      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#ffffff', textAlign: 'center' }}>
          <h3>Feedback Submitted</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{submittedCount}</p>
        </div>
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#ffffff', textAlign: 'center' }}>
          <h3>Pending Feedback</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{pendingCount}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ flex: '0 0 150px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={20} />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
          >
            <option value="">Filter by Status</option>
            <option value="Submitted">Submitted</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

 {/* Tasks Table */}
<div style={{ marginTop: '1.5rem', overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid #ccc' }}>
  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
    <thead style={{ backgroundColor: '#f5f5f5' }}>
      <tr>
        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Task Name</th>
        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Completion Date</th>
        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Assigned Interns</th>
        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
      </tr>
    </thead>
    <tbody>
      {filteredTasks.map(task => (
        <tr key={task.id} style={{ borderBottom: '1px solid #eee' }}>
          <td style={{ padding: '0.75rem' }}>{task.taskName}</td>
          <td style={{ padding: '0.75rem' }}>{new Date(task.completionDate).toLocaleDateString()}</td>
          <td style={{ padding: '0.75rem' }}>{task.interns.length} {task.interns.length > 1 ? 'interns' : 'intern'}</td>
          <td style={{ padding: '0.75rem', fontWeight: 'bold', color: task.status === 'Submitted' ? '#2ecc71' : '#e2e61c' }}>
            {task.status}
          </td>
          <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            {task.status === 'Submitted' ? (
              <>
                <button title="View Feedback" style={buttonStyle} onClick={() => setSelectedTask(task)}>
                  <Eye size={16} />
                </button>
                <button title="Edit Feedback" style={{ ...buttonStyle, backgroundColor: '#f39d1200' }} onClick={() => setSelectedTask(task)}>
                  <Pencil size={16} />
                </button>
              </>
            ) : (
              <button title="Give Feedback" style={{ ...buttonStyle, backgroundColor: '#2ecc7000' }} onClick={() => setSelectedTask(task)}>
                <Edit size={16} />
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {/* Modal */}
      {selectedTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', width: '600px', maxHeight: '90%', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setSelectedTask(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <h2>{selectedTask.taskName}</h2>
            <hr />
            <p><strong>Task Description:</strong></p>
            <p>{selectedTask.taskDescription}</p>
            <hr />
            <p><strong>Assigned Interns:</strong></p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {selectedTask.interns.map((i, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '0.5rem' }}>{i.name}</td>
                    <td style={{ padding: '0.5rem' }}>{i.role}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <input
                        type="text"
                        value={i.feedback || ''}
                        onChange={e => handleFeedbackChange(idx, e.target.value)}
                        style={{ width: '100%', padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
                        placeholder="Enter feedback..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={saveFeedback} style={{ ...buttonStyle, backgroundColor: '#ff8c42', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const buttonStyle = {
  padding: '0.25rem 0.5rem',
  borderRadius: '0.25rem',
  border: '1px solid #cccccc00',
  backgroundColor: '#3498db00',
  color: 'black',
  cursor: 'pointer',
};

export default FeedbackDashboard;
