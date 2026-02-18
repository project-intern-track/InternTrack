import { Search, Filter } from 'lucide-react';

type FeedbackTask = {
  id: string;
  taskName: string;
  completionDate: string;
  intern: string;
  status: 'Pending' | 'Submitted';
};

// Dummy static data
const dummyTasks: FeedbackTask[] = [
  { id: '1', taskName: 'Project Report', completionDate: '2026-02-22', intern: 'Alice Tan', status: 'Submitted' },
  { id: '2', taskName: 'Code Review', completionDate: '2026-02-21', intern: 'Bob Cruz', status: 'Pending' },
  { id: '3', taskName: 'Presentation', completionDate: '2026-02-25', intern: 'Jay Jay Tan', status: 'Pending' },
  { id: '4', taskName: 'Attendance Check', completionDate: '2026-02-20', intern: 'Mia Lopez', status: 'Submitted' },
];

const FeedbackDashboard = () => {
  const submittedCount = dummyTasks.filter(t => t.status === 'Submitted').length;
  const pendingCount = dummyTasks.filter(t => t.status === 'Pending').length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <h1>Feedback Dashboard</h1>
      <p style={{ color: '#555' }}>Overview of submitted and pending feedback for interns.</p>

      {/* Top Containers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <div style={{
          padding: '1rem',
          borderRadius: '0.5rem',
          backgroundColor: '#ffffff',
          color: 'black',
          textAlign: 'center'
        }}>
          <h3>Feedback Submitted</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{submittedCount}</p>
        </div>

        <div style={{
          padding: '1rem',
          borderRadius: '0.5rem',
          backgroundColor: '#ffffff',
          color: 'black',
          textAlign: 'center'
        }}>
          <h3>Pending Feedback</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{pendingCount}</p>
        </div>
      </div>

      {/* Search & Filter Container */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        border: '1px solid #ccc',
        borderRadius: '0.5rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search tasks..."
            style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ flex: '0 0 150px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={20} />
          <select style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}>
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
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Assigned Intern</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {dummyTasks.map(task => (
              <tr key={task.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>{task.taskName}</td>
                <td style={{ padding: '0.75rem' }}>{new Date(task.completionDate).toLocaleDateString()}</td>
                <td style={{ padding: '0.75rem' }}>{task.intern}</td>
                <td style={{
                  padding: '0.75rem',
                  fontWeight: 'bold',
                  color: task.status === 'Submitted' ? '#2ecc71' : '#e74c3c',
                }}>
                  {task.status}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    border: '1px solid #ccc',
                    backgroundColor: '#3498db',
                    color: 'white',
                    cursor: 'pointer',
                  }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeedbackDashboard;
