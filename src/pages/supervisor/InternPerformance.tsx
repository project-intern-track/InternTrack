import { BarChart } from 'lucide-react';

type Intern = {
  id: string;
  name: string;
  email: string;
  totalHours: number;
  tasksCompleted: number;
  attendancePercent: number;
  performanceStatus: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
};

// Sample static data
const interns: Intern[] = [
  { id: '1', name: 'Alice Tan', email: 'alice@example.com', totalHours: 120, tasksCompleted: 15, attendancePercent: 95, performanceStatus: 'Excellent' },
  { id: '2', name: 'Bob Cruz', email: 'bob@example.com', totalHours: 100, tasksCompleted: 12, attendancePercent: 90, performanceStatus: 'Good' },
  { id: '3', name: 'Jay Jay Tan', email: 'jayjay@example.com', totalHours: 85, tasksCompleted: 10, attendancePercent: 80, performanceStatus: 'Average' },
  { id: '4', name: 'Mia Lopez', email: 'mia@example.com', totalHours: 60, tasksCompleted: 5, attendancePercent: 70, performanceStatus: 'Needs Improvement' },
];

const InternPerformance = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <BarChart size={36} />
        <div>
          <h1 style={{ margin: 0 }}>Intern Performance</h1>
          <p style={{ color: '#555', margin: 0 }}>
            Overview of intern attendance, tasks, and performance metrics.
          </p>
        </div>
      </div>

      {/* Performance Table */}
      <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid #ccc' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Intern</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Total Hours</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tasks Completed</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Attendance %</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Performance Status</th>
            </tr>
          </thead>
          <tbody>
            {interns.map(intern => (
              <tr key={intern.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>
                  <strong>{intern.name}</strong>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{intern.email}</div>
                </td>
                <td style={{ padding: '0.75rem' }}>{intern.totalHours}</td>
                <td style={{ padding: '0.75rem' }}>{intern.tasksCompleted}</td>
                <td style={{ padding: '0.75rem' }}>{intern.attendancePercent}%</td>
                <td style={{ padding: '0.75rem', textTransform: 'capitalize', fontWeight: 'bold', color: performanceColor(intern.performanceStatus) }}>
                  {intern.performanceStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper for performance status colors
const performanceColor = (status: Intern['performanceStatus']) => {
  switch (status) {
    case 'Excellent': return '#2ecc71';
    case 'Good': return '#3498db';
    case 'Average': return '#f39c12';
    case 'Needs Improvement': return '#e74c3c';
  }
};

export default InternPerformance;
